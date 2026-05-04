import { IncomingForm } from "formidable";
import fs from "fs";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/requireAdmin";
import {
  DEFAULT_MODEL_ID,
  PREVIEWS_BUCKET,
  fail,
  firstFile,
  firstString,
  previewFilename,
  previewKey,
  s3,
  slugify,
  validateElevenlabsId,
  validateGender,
  validateModelId,
  validatePreviewFile,
  validatePyroName,
} from "@/lib/voicesShared";

export const config = {
  api: { bodyParser: false },
  maxDuration: 60,
};

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ maxFileSize: 10 * 1024 * 1024 });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  let parsed;
  try {
    parsed = await parseForm(req);
  } catch (e) {
    return fail(res, 400, "Could not parse form data.", null, e.message);
  }

  const pyroName = (firstString(parsed.fields.pyro_name) || "").trim();
  const elevenlabsId = (firstString(parsed.fields.elevenlabs_id) || "").trim();
  const gender = (firstString(parsed.fields.voice_gender) || "").trim();
  const modelId =
    (firstString(parsed.fields.model_id) || "").trim() || DEFAULT_MODEL_ID;
  const file = firstFile(parsed.files);

  for (const v of [
    validatePyroName(pyroName),
    validateElevenlabsId(elevenlabsId),
    validateGender(gender),
    validateModelId(modelId),
    validatePreviewFile(file, { required: true }),
  ]) {
    if (v) return fail(res, 400, v.error, v.field, v.hint);
  }

  const slug = slugify(pyroName);
  if (!slug) {
    return fail(
      res,
      400,
      "Display name must contain at least one letter or digit.",
      "pyro_name"
    );
  }

  const choicesRef = adminDb.doc("fetch_data_to_frontend/pyro_voices");
  const pyroRef = adminDb.doc(`pyro_voices/${slug}`);
  const infernoRef = adminDb.doc(`inferno_voices/${slug}`);

  const choicesSnap = await choicesRef.get();
  const existingChoices =
    (choicesSnap.exists && choicesSnap.data().pyro_voice_choices) || [];
  if (existingChoices.includes(pyroName)) {
    return fail(
      res,
      400,
      `A voice named '${pyroName}' already exists. Pick a different name or remove the existing one first.`,
      "pyro_name"
    );
  }

  const filename = previewFilename(gender, slug);
  const key = previewKey(gender, slug);
  const body = await fs.promises.readFile(file.filepath);

  const s3Client = s3();
  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: PREVIEWS_BUCKET,
        Key: key,
        Body: body,
        ContentType: "audio/mpeg",
      })
    );
  } catch (e) {
    console.error("voices/add S3 PutObject failed", e);
    return fail(
      res,
      502,
      "Failed to upload preview to S3.",
      "preview",
      e.message
    );
  }

  const record = {
    pyro_name: pyroName,
    elevenlabs_id: elevenlabsId,
    voice_preview_filename: filename,
    model_id: modelId,
  };

  try {
    await adminDb.runTransaction(async (tx) => {
      const choicesNow = await tx.get(choicesRef);
      const arr =
        (choicesNow.exists && choicesNow.data().pyro_voice_choices) || [];
      if (arr.includes(pyroName)) {
        throw new Error("DUPLICATE");
      }
      const next = [...arr, pyroName].sort((a, b) => a.localeCompare(b));
      tx.set(pyroRef, record);
      tx.set(infernoRef, {
        inferno_name: pyroName,
        elevenlabs_id: elevenlabsId,
        voice_preview_filename: filename,
        model_id: modelId,
      });
      tx.set(
        choicesRef,
        { pyro_voice_choices: next, updated_at: FieldValue.serverTimestamp() },
        { merge: true }
      );
    });
  } catch (e) {
    try {
      await s3Client.send(
        new DeleteObjectCommand({ Bucket: PREVIEWS_BUCKET, Key: key })
      );
    } catch (cleanupErr) {
      console.error("voices/add S3 cleanup failed", cleanupErr);
    }
    if (e.message === "DUPLICATE") {
      return fail(
        res,
        409,
        `A voice named '${pyroName}' was added by another session. Reload the page.`,
        "pyro_name"
      );
    }
    console.error("voices/add Firestore transaction failed", e);
    return fail(
      res,
      502,
      "Failed to save voice metadata. Preview upload was rolled back.",
      null,
      e.message
    );
  }

  return res.status(200).json({
    ok: true,
    voice: { pyro_name: pyroName, slug, voice_preview_filename: filename },
  });
}

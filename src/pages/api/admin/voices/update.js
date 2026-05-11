import { IncomingForm } from "formidable";
import fs from "fs";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/requireAdmin";
import {
  PREVIEWS_BUCKET,
  PREVIEWS_PREFIX,
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
  if (req.method !== "PATCH" && req.method !== "POST") {
    res.setHeader("Allow", ["PATCH", "POST"]);
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

  const originalName = (firstString(parsed.fields.original_pyro_name) || "").trim();
  if (!originalName) {
    return fail(
      res,
      400,
      "original_pyro_name is required to identify the voice.",
      "original_pyro_name"
    );
  }
  const originalId = (firstString(parsed.fields.original_id) || "").trim();

  const newName = firstString(parsed.fields.pyro_name);
  const newElId = firstString(parsed.fields.elevenlabs_id);
  const newGender = firstString(parsed.fields.voice_gender);
  const newModel = firstString(parsed.fields.model_id);
  const file = firstFile(parsed.files);

  if (newName != null) {
    const v = validatePyroName(newName);
    if (v) return fail(res, 400, v.error, v.field, v.hint);
  }
  if (newElId != null) {
    const v = validateElevenlabsId(newElId);
    if (v) return fail(res, 400, v.error, v.field, v.hint);
  }
  if (newGender != null) {
    const v = validateGender(newGender);
    if (v) return fail(res, 400, v.error, v.field, v.hint);
  }
  if (newModel != null) {
    const v = validateModelId(newModel);
    if (v) return fail(res, 400, v.error, v.field, v.hint);
  }
  const fileErr = validatePreviewFile(file, { required: false });
  if (fileErr) return fail(res, 400, fileErr.error, fileErr.field, fileErr.hint);

  const docId = originalId || slugify(originalName);
  const originalRef = adminDb.doc(`pyro_voices/${docId}`);
  const originalSnap = await originalRef.get();
  if (!originalSnap.exists) {
    return fail(res, 404, `No voice named '${originalName}' found.`, "original_pyro_name");
  }
  const original = originalSnap.data();
  const storedOriginalName = original.pyro_name || originalName;

  const merged = {
    pyro_name: newName != null ? newName.trim() : original.pyro_name,
    elevenlabs_id:
      newElId != null ? newElId.trim() : original.elevenlabs_id,
    voice_gender:
      newGender != null
        ? newGender
        : (original.voice_preview_filename || "").split("/")[0] || "male",
    model_id: newModel != null && newModel.trim() ? newModel.trim() : original.model_id,
  };

  const newSlug = slugify(merged.pyro_name);
  if (!newSlug) {
    return fail(
      res,
      400,
      "Display name must contain at least one letter or digit.",
      "pyro_name"
    );
  }

  const isRename = merged.pyro_name !== storedOriginalName;
  const oldKey = `${PREVIEWS_PREFIX}/${original.voice_preview_filename}`;
  const newKey = previewKey(merged.voice_gender, newSlug);
  const newFilename = previewFilename(merged.voice_gender, newSlug);

  const choicesRef = adminDb.doc("fetch_data_to_frontend/pyro_voices");
  if (isRename) {
    const choicesSnap = await choicesRef.get();
    const arr =
      (choicesSnap.exists && choicesSnap.data().pyro_voice_choices) || [];
    if (arr.includes(merged.pyro_name)) {
      return fail(
        res,
        409,
        `A voice named '${merged.pyro_name}' already exists. Pick a different name.`,
        "pyro_name"
      );
    }
  }

  const s3Client = s3();
  let didS3Mutation = false;
  try {
    if (file) {
      const body = await fs.promises.readFile(file.filepath);
      await s3Client.send(
        new PutObjectCommand({
          Bucket: PREVIEWS_BUCKET,
          Key: newKey,
          Body: body,
          ContentType: "audio/mpeg",
        })
      );
      didS3Mutation = true;
      if (oldKey !== newKey) {
        await s3Client.send(
          new DeleteObjectCommand({ Bucket: PREVIEWS_BUCKET, Key: oldKey })
        );
      }
    } else if (oldKey !== newKey) {
      await s3Client.send(
        new CopyObjectCommand({
          Bucket: PREVIEWS_BUCKET,
          CopySource: `/${PREVIEWS_BUCKET}/${oldKey}`,
          Key: newKey,
          MetadataDirective: "COPY",
        })
      );
      didS3Mutation = true;
      await s3Client.send(
        new DeleteObjectCommand({ Bucket: PREVIEWS_BUCKET, Key: oldKey })
      );
    }
  } catch (e) {
    console.error("voices/update S3 mutation failed", e);
    return fail(res, 502, "Failed to update preview in S3.", "preview", e.message);
  }

  const pyroDocRef = adminDb.doc(`pyro_voices/${docId}`);
  const infernoDocRef = adminDb.doc(`inferno_voices/${docId}`);

  // Preserve existing tuning fields if the doc already had them, otherwise
  // fill in sensible defaults. Section editor reads `stability * 100` for
  // the intonation slider; without it the backend crashes on float(None).
  const record = {
    pyro_name: merged.pyro_name,
    elevenlabs_id: merged.elevenlabs_id,
    voice_preview_filename: newFilename,
    model_id: merged.model_id,
    stability: merged.stability ?? 0.5,
    similarity_boost: merged.similarity_boost ?? 0.75,
  };
  const infernoRecord = {
    inferno_name: merged.pyro_name,
    elevenlabs_id: merged.elevenlabs_id,
    voice_preview_filename: newFilename,
    model_id: merged.model_id,
    stability: merged.stability ?? 0.5,
    similarity_boost: merged.similarity_boost ?? 0.75,
  };

  try {
    await adminDb.runTransaction(async (tx) => {
      if (isRename) {
        const choicesNow = await tx.get(choicesRef);
        const arr =
          (choicesNow.exists && choicesNow.data().pyro_voice_choices) || [];
        const next = arr
          .filter((n) => n !== storedOriginalName && n !== originalName)
          .concat([merged.pyro_name])
          .sort((a, b) => a.localeCompare(b));
        tx.set(
          choicesRef,
          { pyro_voice_choices: next, updated_at: FieldValue.serverTimestamp() },
          { merge: true }
        );
      }
      tx.set(pyroDocRef, record);
      tx.set(infernoDocRef, infernoRecord);
    });
  } catch (e) {
    console.error("voices/update Firestore transaction failed", e);
    if (didS3Mutation) {
      console.error(
        "voices/update: S3 was mutated to",
        newKey,
        "but Firestore failed; manual reconciliation may be needed."
      );
    }
    return fail(res, 502, "Failed to save voice metadata.", null, e.message);
  }

  return res.status(200).json({
    ok: true,
    voice: {
      id: docId,
      pyro_name: merged.pyro_name,
      slug: newSlug,
      voice_preview_filename: newFilename,
    },
  });
}

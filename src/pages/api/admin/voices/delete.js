import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/requireAdmin";
import { PREVIEWS_BUCKET, PREVIEWS_PREFIX, fail, s3, slugify } from "@/lib/voicesShared";

export const config = {
  maxDuration: 30,
};

export default async function handler(req, res) {
  if (req.method !== "DELETE" && req.method !== "POST") {
    res.setHeader("Allow", ["DELETE", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const pyroName = (req.body && req.body.pyro_name) || "";
  if (!pyroName || typeof pyroName !== "string") {
    return fail(res, 400, "pyro_name is required.", "pyro_name");
  }

  const slug = slugify(pyroName);
  const choicesRef = adminDb.doc("fetch_data_to_frontend/pyro_voices");
  const pyroRef = adminDb.doc(`pyro_voices/${slug}`);
  const infernoRef = adminDb.doc(`inferno_voices/${slug}`);

  const pyroSnap = await pyroRef.get();
  if (!pyroSnap.exists) {
    return fail(res, 404, `No voice named '${pyroName}' found.`, "pyro_name");
  }
  const previewFilename = pyroSnap.data().voice_preview_filename;

  try {
    await adminDb.runTransaction(async (tx) => {
      const choicesNow = await tx.get(choicesRef);
      const arr =
        (choicesNow.exists && choicesNow.data().pyro_voice_choices) || [];
      const next = arr
        .filter((n) => n !== pyroName)
        .sort((a, b) => a.localeCompare(b));
      tx.set(
        choicesRef,
        { pyro_voice_choices: next, updated_at: FieldValue.serverTimestamp() },
        { merge: true }
      );
      tx.delete(pyroRef);
      tx.delete(infernoRef);
    });
  } catch (e) {
    console.error("voices/delete Firestore transaction failed", e);
    return fail(res, 502, "Failed to remove voice metadata.", null, e.message);
  }

  if (previewFilename) {
    try {
      await s3().send(
        new DeleteObjectCommand({
          Bucket: PREVIEWS_BUCKET,
          Key: `${PREVIEWS_PREFIX}/${previewFilename}`,
        })
      );
    } catch (e) {
      console.error("voices/delete S3 cleanup failed (orphan left)", e);
    }
  }

  return res.status(200).json({ ok: true });
}

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/requireAdmin";
import { CATEGORIES_DOC, fail, validateCategoryList } from "@/lib/voicesShared";

export const config = {
  maxDuration: 30,
};

// Replaces the ordered category list. `renames` maps old name → new name so
// voices filed under a renamed category follow it; categories missing from the
// new list are stripped from every voice that used them.
export default async function handler(req, res) {
  if (req.method !== "PUT" && req.method !== "POST") {
    res.setHeader("Allow", ["PUT", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const body = req.body || {};
  const v = validateCategoryList(body.categories);
  if (v) return fail(res, 400, v.error, v.field, v.hint);
  const categories = body.categories.map((c) => c.trim());

  const renames =
    body.renames && typeof body.renames === "object" ? body.renames : {};
  for (const [from, to] of Object.entries(renames)) {
    if (typeof to !== "string" || !categories.includes(to.trim())) {
      return fail(
        res,
        400,
        `Rename of '${from}' points to a category that isn't in the list.`,
        "renames"
      );
    }
  }

  const keep = new Set(categories);
  const remap = (name) => (renames[name] ? renames[name].trim() : name);

  try {
    const voicesSnap = await adminDb.collection("pyro_voices").get();
    const batch = adminDb.batch();
    let changedVoices = 0;
    for (const doc of voicesSnap.docs) {
      const current = doc.data().categories;
      if (!Array.isArray(current) || current.length === 0) continue;
      const next = [...new Set(current.map(remap))].filter((c) => keep.has(c));
      const unchanged =
        next.length === current.length && next.every((c, i) => c === current[i]);
      if (unchanged) continue;
      batch.update(doc.ref, { categories: next });
      changedVoices += 1;
    }
    batch.set(
      adminDb.doc(CATEGORIES_DOC),
      { categories, updated_at: FieldValue.serverTimestamp() },
      { merge: true }
    );
    await batch.commit();
    return res.status(200).json({ ok: true, categories, changedVoices });
  } catch (e) {
    console.error("voices/categories write failed", e);
    return fail(res, 502, "Failed to save categories.", null, e.message);
  }
}

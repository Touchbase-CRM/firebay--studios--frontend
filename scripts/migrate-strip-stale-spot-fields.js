/*
 * One-off migration: strip music + quick-mode fields from existing Firestore spots.
 *
 * Background: the Pyro UI rebuild removed music and quick mode entirely. Existing
 * spots in Firestore still carry the old fields under `sharedStates.*` and may
 * have quick-mode-specific blocks under `featureSpecificStates`. This script
 * removes them so deserialization stays clean.
 *
 * Idempotent — safe to re-run. Only writes when there's something to remove.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
 *     node scripts/migrate-strip-stale-spot-fields.js [--dry-run] [--project=<id>]
 *
 * Recommended: run against staging first, spot-check, then run against prod.
 */

const admin = require("firebase-admin");

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const projectArg = args.find((a) => a.startsWith("--project="));
const projectId = projectArg ? projectArg.split("=")[1] : process.env.GCLOUD_PROJECT;

const STALE_SHARED_FIELDS = [
  "chosenMusic",
  "previewFileName",
  "backgroundMusicFilename",
  "musicVol",
];

const STALE_FEATURE_FIELDS = [
  // quick-mode only
  "historyItemId",
  "v2aUploadedAudioUrl",
  "v2aQuickUploadedFile",
  "v2aQuickGeneratedAudioBlob",
  "v2aQuickAudioDuration",
];

const STALE_MODES = new Set(["quick-script-to-ad", "quick-voice-to-ad"]);

function init() {
  if (admin.apps.length) return;
  admin.initializeApp({
    projectId,
    credential: admin.credential.applicationDefault(),
  });
}

function pruneObject(obj, keys) {
  const out = {};
  let removed = 0;
  for (const k of Object.keys(obj || {})) {
    if (keys.includes(k)) {
      removed += 1;
      continue;
    }
    out[k] = obj[k];
  }
  return { out, removed };
}

async function migrateAds(db) {
  const snap = await db.collection("ads").get();
  let scanned = 0;
  let updated = 0;
  let untouched = 0;

  for (const docSnap of snap.docs) {
    scanned += 1;
    const data = docSnap.data() || {};
    const sharedStates = data.sharedStates || {};
    const featureSpecificStates = data.featureSpecificStates || {};

    const { out: nextShared, removed: sharedRemoved } = pruneObject(sharedStates, STALE_SHARED_FIELDS);
    const { out: nextFeature, removed: featureRemoved } = pruneObject(
      featureSpecificStates,
      STALE_FEATURE_FIELDS
    );

    if (sharedRemoved === 0 && featureRemoved === 0) {
      untouched += 1;
      continue;
    }

    updated += 1;
    if (isDryRun) {
      console.log(`[dry-run] ads/${docSnap.id} would drop ${sharedRemoved + featureRemoved} field(s)`);
    } else {
      await docSnap.ref.set(
        { sharedStates: nextShared, featureSpecificStates: nextFeature },
        { merge: false }
      );
      console.log(`ads/${docSnap.id} stripped ${sharedRemoved + featureRemoved} stale field(s)`);
    }
  }
  return { scanned, updated, untouched };
}

async function migrateMetadata(db) {
  const snap = await db.collection("spots_meta_data").get();
  let scanned = 0;
  let deleted = 0;
  let kept = 0;

  for (const docSnap of snap.docs) {
    scanned += 1;
    const mode = docSnap.data()?.mode;
    if (mode && STALE_MODES.has(mode)) {
      if (isDryRun) {
        console.log(`[dry-run] spots_meta_data/${docSnap.id} (mode=${mode}) would be DELETED`);
      } else {
        await docSnap.ref.delete();
        console.log(`spots_meta_data/${docSnap.id} (mode=${mode}) deleted`);
      }
      deleted += 1;
    } else {
      kept += 1;
    }
  }
  return { scanned, deleted, kept };
}

async function deleteOrphanedAds(db) {
  const snap = await db.collection("ads").get();
  let deleted = 0;
  for (const docSnap of snap.docs) {
    const metaSnap = await db.collection("spots_meta_data").doc(docSnap.id).get();
    if (!metaSnap.exists) {
      if (isDryRun) {
        console.log(`[dry-run] ads/${docSnap.id} is orphaned, would be DELETED`);
      } else {
        await docSnap.ref.delete();
        console.log(`ads/${docSnap.id} (orphaned) deleted`);
      }
      deleted += 1;
    }
  }
  return deleted;
}

(async () => {
  if (!projectId) {
    console.error("Set --project=<id> or GCLOUD_PROJECT env var.");
    process.exit(1);
  }
  init();
  const db = admin.firestore();

  console.log(`Project: ${projectId}`);
  console.log(`Dry run: ${isDryRun ? "yes" : "no"}`);
  console.log("");

  console.log("Step 1 — strip stale fields from `ads` documents");
  const adsResult = await migrateAds(db);
  console.log(`  scanned=${adsResult.scanned} updated=${adsResult.updated} untouched=${adsResult.untouched}`);
  console.log("");

  console.log("Step 2 — delete `spots_meta_data` documents in retired modes");
  const metaResult = await migrateMetadata(db);
  console.log(`  scanned=${metaResult.scanned} deleted=${metaResult.deleted} kept=${metaResult.kept}`);
  console.log("");

  console.log("Step 3 — delete orphaned `ads` documents (no matching metadata)");
  const orphans = await deleteOrphanedAds(db);
  console.log(`  orphans=${orphans}`);
  console.log("");

  console.log("Done.");
  process.exit(0);
})().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

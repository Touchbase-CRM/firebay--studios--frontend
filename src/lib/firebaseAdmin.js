import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY env var is not set. " +
        "Add it in Vercel project settings (Production + Preview): " +
        "the full JSON from Firebase Console → Project Settings → " +
        "Service Accounts → Generate new private key."
    );
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON. " +
        "It must be the entire service account JSON as a single string."
    );
  }
}

if (!getApps().length) {
  initializeApp({ credential: cert(loadServiceAccount()) });
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();

//Relative path: src/firebase.js
import { initializeApp, getApps } from "firebase/app";
import { getAuth as _firebaseGetAuth } from "firebase/auth";
import { getDatabase, ref, onValue } from "firebase/database";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Auto-detect: when there's no real Firebase API key (e.g. local dev without
// .env.local), fall back to a placeholder config + stub auth so the UI can
// still render. Production builds with NEXT_PUBLIC_FIREBASE_API_KEY set use
// the real SDK paths.
const dev = !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const firebaseConfigDev = {
  apiKey: "AIzaSyA-Pn_blUVMK2GWhlNNtav9PARQv7Wm0no",
  authDomain: "touchbase--dev.firebaseapp.com",
  projectId: "touchbase--dev",
  storageBucket: "touchbase--dev.appspot.com",
  messagingSenderId: "1051216659960",
  appId: "1:1051216659960:web:4afba10ee9047e2716820d",
};

// Initialize Firebase
const config = dev ? firebaseConfigDev : firebaseConfig;

// UI preview mode: true when running with the placeholder dev config so the
// auth context can inject a stub user instead of listening on a broken auth.
export const isUiPreviewMode = dev;

const app = !getApps().length ? initializeApp(config) : getApps()[0];

// In UI preview mode, expose a stub `getAuth` so callers that import it from
// here don't crash on Firebase's API-key validation. Real builds re-export the
// SDK's getAuth unchanged.
const PREVIEW_USER = { uid: "preview-user", email: "preview@firebaystudios.com" };
const STUB_AUTH = {
  currentUser: PREVIEW_USER,
  signOut: async () => {},
};
export const getAuth = isUiPreviewMode ? () => STUB_AUTH : _firebaseGetAuth;

export default app;

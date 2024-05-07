//Relative path: src/firebase.js
// Import the functions you need from the SDKs you are using
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
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

const dev = false; // flip to false for production
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
const app = !getApps().length ? initializeApp(config) : getApps()[0];

// Initialize Firebase Auth
const auth = getAuth(app);

export default app;

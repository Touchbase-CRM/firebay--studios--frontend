import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const dev = true // flip to false for production
const firebaseConfigDev = {
  apiKey: "AIzaSyA-Pn_blUVMK2GWhlNNtav9PARQv7Wm0no",
  authDomain: "touchbase--dev.firebaseapp.com",
  projectId: "touchbase--dev",
  storageBucket: "touchbase--dev.appspot.com",
  messagingSenderId: "1051216659960",
  appId: "1:1051216659960:web:4afba10ee9047e2716820d"
};


if (!firebase.apps.length) {
  if (dev) {
    firebase.initializeApp(firebaseConfigDev);
  }
  else {
    firebase.initializeApp(firebaseConfig);
  }

}
export default firebase;
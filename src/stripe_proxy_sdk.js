"use client";
import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  getFirestore,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

export const getCheckoutUrl = async (app, priceId) => {
  const auth = getAuth(app);
  const userId = auth.currentUser?.uid;
  console.log("User ID:", userId);
  if (!userId) throw new Error("User is not authenticated");

  const db = getFirestore(app);
  const checkoutSessionRef = collection(
    db,
    "customers",
    userId,
    "checkout_sessions"
  );

  const docRef = await addDoc(checkoutSessionRef, {
    price: priceId,
    success_url: window.location.origin + "/verification",
    cancel_url: window.location.origin + "/signup",
  });

  return new Promise((resolve, reject) => {
    const unsubscribe = onSnapshot(docRef, (snap) => {
      const data = snap.data();
      const error = data?.error;
      const url = data?.url;
      if (error) {
        unsubscribe();
        reject(new Error(`An error occurred: ${error.message}`));
      }
      if (url) {
        console.log("Stripe Checkout URL:", url);
        unsubscribe();
        resolve(url);
      }
    });
  });
};

export const getSubscriptionStatus = async (app) => {
  const auth = getAuth(app);
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("User not logged in");

  const db = getFirestore(app);
  const subscriptionsRef = collection(db, "customers", userId, "subscriptions");
  const subscriptionQuery = query(
    subscriptionsRef,
    where("status", "in", ["trialing", "active"])
  );

  return new Promise((resolve, reject) => {
    const unsubscribe = onSnapshot(
      subscriptionQuery,
      (snapshot) => {
        // In this implementation we only expect one active or trialing subscription to exist.
        console.log("Subscription snapshot", snapshot.docs.length);
        if (snapshot.docs.length === 0) {
          console.log("No active or trialing subscriptions found");
          resolve(false);
        } else {
          console.log("Active or trialing subscription found");
          resolve(true);
        }
        unsubscribe();
      },
      (error) => {
        reject(error);
      }
    );
  });
};

// export const getPortalUrl = async (app) => {
//   const auth = getAuth(app);
//   const user = auth.currentUser;

//   let dataWithUrl;
//   try {
//     const functions = getFunctions(app, "us-central1");
//     const functionRef = httpsCallable(
//       functions,
//       "ext-firestore-stripe-payments-createPortalLink"
//     );
//     const response = await functionRef({
//       customerId: user?.uid,
//       returnUrl: window.location.origin,
//     });
//     dataWithUrl = response.data;
//     console.log("Reroute to Stripe portal: ", dataWithUrl.url);
//   } catch (error) {
//     console.error(error);
//   }

//   return new Promise((resolve, reject) => {
//     if (dataWithUrl && dataWithUrl.url) {
//       resolve(dataWithUrl.url);
//     } else {
//       reject(new Error("No url returned"));
//     }
//   });
// };

import { Card, Button } from "react-bootstrap";
import { NavBar } from "@/components/navBar";
import { ActionSelectorModal } from "@/components/ActionSelectorModal/actionSelector";
import Link from "next/link";
import Swal from "sweetalert2";

import withAuth from "../hocs/withAuth";
import { getAuth } from "firebase/auth";
import app from "../firebase";
import { useRouter } from "next/router";
import { getPortalUrl } from "../stripe_proxy_sdk";
import useUserInputsStore from "../store/userInputs";
import React, { useState, useEffect, useRef } from "react";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  getDoc,
  addDoc,
} from "firebase/firestore";

import { defaultState } from "../store/shared_default_values";
import { advancedScriptToAdDefaultValues } from "@/store/features/core/advanced/script-to-ad";
import { quickVoiceToAdDefaultValues } from "@/store/features/core/quick/voice-to-ad";
import { quickScriptToAdDefaultValues } from "../store/features/core/quick/script-to-ad";

function Home() {
  const auth = getAuth();
  const router = useRouter();
  const firestore = getFirestore(app);
  const { reset: resetUserInputsStore } = useUserInputsStore();
  const [monthlyDownloads, setMonthlyDownloads] = useState(0);
  const [quickModeModalShow, setQuickModeModalShow] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const { projectName } = router.query;

  useEffect(() => {
    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      const notificationsRef = collection(firestore, "notifications");
      const q = query(notificationsRef, where("user_id", "==", uid));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const loadedNotifications = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(loadedNotifications);
      });

      return () => unsubscribe();
    }
  }, [auth.currentUser]);

  useEffect(() => {
    resetUserInputsStore();

    const fetchMonthlyDownloads = async () => {
      if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        const docRef = doc(firestore, "uid_to_org", uid);
        const docSnap = await getDoc(docRef);

        if (
          docSnap.exists() &&
          docSnap.data().monthly_downloads !== undefined
        ) {
          setMonthlyDownloads(docSnap.data().monthly_downloads);
        }
      }
    };

    fetchMonthlyDownloads();
  }, []);

  const deleteNotification = (notificationId) => {
    const docRef = doc(firestore, "notifications", notificationId);
    deleteDoc(docRef)
      .then(() => {
        setNotifications((prevNotifications) =>
          prevNotifications.filter(
            (notification) => notification.id !== notificationId
          )
        );
      })
      .catch((error) => console.error("Error deleting notification: ", error));
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    auth
      .signOut()
      .then(() => {
        router.push("/login");
      })
      .catch((error) => {
        console.error("Logout Error:", error);
      });
  };
  const handleManageSubscription = async () => {
    const userId = auth.currentUser ? auth.currentUser.uid : "anonymous";

    if (userId === process.env.NEXT_PUBLIC_PYRO_GUEST_FIREBASE_UID) {
      Swal.fire({
        icon: "info",
        title: "Oops...",
        text: "Trial users are not authorized to manage subscriptions.",
      });
      return;
    }
    try {
      // SweetAlert2 confirmation dialog
      const result = Swal.fire({
        title: "Redirecting to Subscription Management",
        text: "You will be redirected to the subscription management page in a new tab.",
        icon: "info",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "Got it!",
      });

      const portalUrl = await getPortalUrl(app);
      window.open(portalUrl, "_blank");
    } catch (error) {
      console.error("Error opening portal: ", error);
    }
  };
  const dropdownItems = [
    // {
    //   text: "Manage Subscription",
    //   handler: handleManageSubscription,
    // },
    {
      text: "Logout",
      handler: handleLogout,
    },
  ];

  const handleQuickModeModalOpen = () => setQuickModeModalShow(true);
  const handleQuickModeModalClose = () => setQuickModeModalShow(false);

  const isCustomClass = (obj) => obj?.signature === "fsCustomClass";
  const serializeInstance = (instance) => {
    const proto = Object.getPrototypeOf(instance);
    return Object.getOwnPropertyNames(proto)
      .filter(
        (prop) => typeof instance[prop] === "function" && prop.startsWith("get")
      )
      .reduce((acc, getterName) => {
        const propName =
          getterName.charAt(3).toLowerCase() + getterName.slice(4);
        acc[propName] = instance[getterName]();
        return acc;
      }, {});
  };

  const serializeProperties = (dataObject) => {
    if (Array.isArray(dataObject)) {
      return dataObject.map(serializeProperties);
    } else if (dataObject && typeof dataObject === "object") {
      return Object.keys(dataObject).reduce((serializedResult, key) => {
        const value = dataObject[key];
        serializedResult[key] = isCustomClass(value)
          ? serializeInstance(value)
          : typeof value === "object"
          ? serializeProperties(value)
          : value;
        return serializedResult;
      }, {});
    }
    return dataObject;
  };

  const saveToFirestore = async (data, projectName, mode) => {
    const db = getFirestore(app);
    const adsCollectionRef = collection(db, "ads");
    try {
      const docRef = await addDoc(adsCollectionRef, {
        ...data,
        projectName,
        mode,
      });
      console.log("Document written with ID:", docRef.id);
    } catch (error) {
      console.error("Error adding document to Firestore:", error);
    }
  };
  const serializeAndSaveModeData = async (
    mode,
    projectName,
    modeSpecificStates,
    sharedStates
  ) => {
    const serializedModeSpecificStates =
      serializeProperties(modeSpecificStates);
    const serializedSharedStates = serializeProperties(sharedStates);

    const data = {
      mode: mode,
      featureSpecificStates: serializedModeSpecificStates,
      sharedStates: serializedSharedStates,
    };

    await saveToFirestore(data, projectName, mode);
  };
  const saveQuickScriptToAd = async (projectName) => {
    await serializeAndSaveModeData(
      "QuickScriptToAd",
      projectName,
      quickScriptToAdDefaultValues,
      defaultState
    );
  };
  const saveQuickVoiceToAd = async (projectName) => {
    await serializeAndSaveModeData(
      "QuickVoiceToAd",
      projectName,
      quickVoiceToAdDefaultValues,
      defaultState
    );
  };
  const saveAdvancedScriptToAd = async (projectName) => {
    await serializeAndSaveModeData(
      "AdvancedScriptToAd",
      projectName,
      advancedScriptToAdDefaultValues,
      defaultState
    );
  };

  const buttonOptions = [
    {
      text: "Script to Ad",
      handler: async () => {
        await saveQuickScriptToAd(projectName);
        handleQuickModeModalClose();
        router.push("/quick-mode/script-to-ad/create-ad");
      },
      variant: "success",
      backgroundColor: "#eb631c",
      borderColor: "#eb631c",
      textColor: "white",
    },
    {
      text: "Voice to Ad",
      handler: async () => {
        await saveQuickVoiceToAd(projectName);
        handleQuickModeModalClose();
        router.push("/quick-mode/voice-to-ad/create-ad");
      },
      variant: "primary",
      backgroundColor: "white",
      borderColor: "#FDA942",
      textColor: "black",
    },
  ];

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <NavBar links={[]} dropdownItems={dropdownItems} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "#FFFFFF",
          padding: "20px",
        }}
      >
        <Card
          style={{
            width: "400px",
            height: "570px",
            marginTop: "10px",
            marginBottom: "300px",
            position: "relative",
            borderRadius: "15px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "transparent",
            border: "1px solid #eb631c",
          }}
        >
          <Card.Header
            style={{
              padding: "16px",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              backgroundColor: "#e4e4e4",
              color: "black",
            }}
          >
            <h1 style={{ margin: 0, fontSize: "24px" }}>Starter</h1>
          </Card.Header>
          <Card.Body
            style={{
              paddingTop: "20px",
              paddingBottom: "20px",
              flex: "1",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-around",
              backgroundColor: "#FFFFFF",
              color: "black",
            }}
          >
            <Button
              onClick={handleQuickModeModalOpen}
              style={{
                backgroundColor: "#eb631c",
                color: "white",
                marginBottom: "20px",
                borderColor: "#eb631c",
                width: "100%",
                padding: "10px 20px",
                fontSize: "16px",
                borderRadius: "12px",
              }}
            >
              Quick Ad Generation
            </Button>
            <ActionSelectorModal
              show={quickModeModalShow}
              onHide={handleQuickModeModalClose}
              title="Choose Ad Type"
              buttonOptions={buttonOptions}
            />

            <div style={{ marginBottom: "20px" }}>
              <button
                onClick={async () => {
                  await saveAdvancedScriptToAd(projectName);
                  router.push("/advanced-mode/script-to-ad/create-sections");
                }}
                style={{
                  backgroundColor: "#eb631c",
                  color: "white",
                  border: "1px solid #eb631c",
                  width: "100%",
                  padding: "10px 20px",
                  fontSize: "16px",
                  cursor: "pointer",
                  textDecoration: "none",
                  display: "inline-block",
                  margin: "4px 2px",
                  transitionDuration: "0.4s",
                  borderRadius: "12px",
                }}
              >
                Advanced Ad Generation
              </button>
            </div>
            <div style={{ marginBottom: "20px" }}>
              <Link href="/dashboard" passHref>
                <button
                  style={{
                    backgroundColor: "#eb631c",
                    color: "white",
                    border: "1px solid #eb631c",
                    width: "100%",
                    padding: "10px 20px",
                    fontSize: "16px",
                    cursor: "pointer",
                    textDecoration: "none",
                    display: "inline-block",
                    margin: "4px 2px",
                    transitionDuration: "0.4s",
                    borderRadius: "12px",
                  }}
                >
                  Discard
                </button>
              </Link>
            </div>
          </Card.Body>
          <Card.Footer
            style={{
              borderTop: "1px solid rgba(255,255,255,0.1)",
              padding: "12px 16px",
              backgroundColor: "#e4e4e4",
              boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
              background: "linear-gradient(to right, #e4e4e4, #f9f9f9)",
              borderRadius: "0 0 10px 10px",
              fontSize: "10px",
              lineHeight: "1.6",
              textAlign: "center",
            }}
          >
            <p>
              <i
                className="bi bi-exclamation-triangle-fill"
                style={{ marginRight: "8px", color: "#eb631c" }}
              ></i>
              * Once you start creating an ad, please do not use the browser
              back button or reload the page. You will lose all your progress
              and it will log you out of your account.
            </p>
          </Card.Footer>
        </Card>
        {/* Display monthly downloads alert if available */}
        {monthlyDownloads > 0 && (
          <div
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "20px",
              marginTop: "5px",
              backgroundColor: "#f8d7da",
              color: "#721c24",
              borderRadius: "4px",
              border: "1px solid #f5c6cb",
              textAlign: "center",
              fontSize: "24px",
              fontFamily: "Arial, sans-serif",
              fontWeight: "bold",
            }}
          >
            Attention: Currently, you have made {monthlyDownloads} chargeable
            downloads this month. If you have mistakenly downloaded a file,
            please contact{" "}
            <a
              href="mailto:kjayamanna@firebaystudios.com"
              style={{ color: "#721c24" }}
            >
              kjayamanna@firebaystudios.com
            </a>{" "}
            asap.
          </div>
        )}
        {notifications.map((notification) => (
          <div
            key={notification.id}
            style={{
              width: "100%",
              padding: "20px",
              marginBottom: "10px",
              marginTop: "10px",
              backgroundColor: "#fff8e1", // Parchment-like background color
              color: "#5e412f", // Dark brown text color reminiscent of ink
              borderRadius: "8px",
              border: "1px solid #f4e4bc", // Subtle border color
              textAlign: "left", // Align text to the left
              fontSize: "16px", // Size adjusted for readability with decorative fonts
              fontFamily: "'EB Garamond', serif", // A font that is reminiscent of Renaissance typefaces
              boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)", // Soft shadow for a slight lift effect
              display: "flex", // Use flexbox for layout
              justifyContent: "space-between", // Space between title/message and button
              alignItems: "center", // Vertically center align items
            }}
          >
            <div>
              <div style={{ fontSize: "20px", marginBottom: "4px" }}>
                {notification.title}
              </div>
              <div style={{ fontStyle: "italic" }}>
                <span style={{ fontWeight: "bold" }}>
                  {notification.notification_type}:
                </span>{" "}
                {notification.message}
              </div>
            </div>
            <button
              onClick={() => deleteNotification(notification.id)}
              style={{
                backgroundColor: "#ac9485", // Button color that complements the theme
                color: "#fff",
                border: "none",
                cursor: "pointer",
                padding: "5px 10px",
                borderRadius: "4px",
                fontFamily: "'EB Garamond', serif",
                fontSize: "16px",
                marginLeft: "20px", // Give some space between the text and button
              }}
            >
              Close
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default withAuth(Home);

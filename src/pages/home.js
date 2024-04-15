// import { Navbar, Nav, Button, Card } from "react-bootstrap";
import { Card, Modal, Button } from "react-bootstrap";
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
import { getFirestore, doc, getDoc } from "firebase/firestore";

function Home() {
  const auth = getAuth();
  const router = useRouter();
  const firestore = getFirestore(app);
  const { reset: resetUserInputsStore } = useUserInputsStore();
  const [monthlyDownloads, setMonthlyDownloads] = useState(0);
  const [quickModeModalShow, setQuickModeModalShow] = useState(false);
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
    {
      text: "Manage Subscription",
      handler: handleManageSubscription,
    },
    {
      text: "Logout",
      handler: handleLogout,
    },
  ];

  const handleQuickModeModalOpen = () => setQuickModeModalShow(true);
  const handleQuickModeModalClose = () => setQuickModeModalShow(false);

  const buttonOptions = [
    {
      text: "Script to Ad",
      handler: handleQuickModeModalClose,
      href: "/quick-mode/script-to-ad/create-ad",
      variant: "success",
      backgroundColor: "#eb631c",
      borderColor: "#eb631c",
      textColor: "white",
    },
    {
      text: "Voice to Ad",
      handler: handleQuickModeModalClose,
      href: "/quick-mode/voice-to-ad/create-ad",
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
              <Link href="/advanced-mode/script-to-ad/create-sections" passHref>
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
                  Advanced Ad Generation
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
      </div>
    </div>
  );
}

export default withAuth(Home);

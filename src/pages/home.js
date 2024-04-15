// import { Navbar, Nav, Button, Card } from "react-bootstrap";
import { Card, Modal, Button } from "react-bootstrap";
import { NavBar } from "@/components/navBar";
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
            backgroundColor: "transparent", // Retained as transparent
            border: "1px solid #eb631c", // Retained as is
            color: "black", // Retained as black
          }}
        >
          <Card.Header
            style={{
              padding: "16px",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              backgroundColor: "#e4e4e4", // Changed to light gray
              color: "black", // Changed to black
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
              backgroundColor: "#FFFFFF", // Retained as white
              color: "black", // Retained as black
            }}
          >
            <Button
              onClick={handleQuickModeModalOpen}
              style={{
                backgroundColor: "#eb631c",
                color: "white",
                marginBottom: "20px",
                borderColor: "#eb631c",
              }}
            >
              Quick Ad Generation
            </Button>
            <Modal
              show={quickModeModalShow}
              onHide={handleQuickModeModalClose}
              centered
            >
              <Modal.Header closeButton>
                <Modal.Title>Choose Ad Type</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div className="d-grid gap-2">
                  <Link href="/quick-mode/script-to-ad/create-ad" passHref>
                    <Button
                      variant="success"
                      size="lg"
                      onClick={handleQuickModeModalClose}
                    >
                      Script to Ad
                    </Button>
                  </Link>
                  <Link href="/quick-mode/voice-to-ad/create-ad" passHref>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleQuickModeModalClose}
                    >
                      Voice to Ad
                    </Button>
                  </Link>
                </div>
              </Modal.Body>
            </Modal>
            <div style={{ marginBottom: "20px" }}>
              <Link href="/advanced-mode/script-to-ad/create-sections" passHref>
                <button
                  style={{
                    width: "100%",
                    padding: "10px 20px",
                    fontSize: "16px",
                    cursor: "pointer",
                    backgroundColor: "#eb631c", // Custom color for the button
                    border: "#eb631c",
                    color: "white", // White text color for buttons
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
              color: "black",
              boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)", // Subtle shadow for depth
              background: "linear-gradient(to right, #e4e4e4, #f9f9f9)", // Gradient background
              borderRadius: "0 0 10px 10px", // Rounded corners at the bottom
              fontSize: "10px", // Enhanced typography
              lineHeight: "1.6", // Improved line spacing for readability
              textAlign: "center", // Center align text
            }}
          >
            <p>
              <i
                className="bi bi-exclamation-triangle-fill"
                style={{ marginRight: "8px", color: "#eb631c" }}
              ></i>{" "}
              {/* Example icon */}* Once you start creating an ad, please do not
              use the browser back button or reload the page. You will lose all
              your progress and it will log you out of your account.
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
      </div>
    </div>
  );
}

export default withAuth(Home);

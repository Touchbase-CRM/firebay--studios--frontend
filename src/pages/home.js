import { Navbar, Nav, Button, Card } from "react-bootstrap";
import Link from "next/link";
import CustomDropdown from "../components/CustomDropdown";
import Swal from "sweetalert2";

import withAuth from "../hocs/withAuth";
import { getAuth } from "firebase/auth";
import app from "../firebase";
import { useRouter } from "next/router";
import { getPortalUrl } from "../stripe_proxy_sdk";
import useUserInputsStore from "../store/userInputs";
import React, { useState, useEffect, useRef } from "react";

function Home() {
  const auth = getAuth();
  const router = useRouter();
  const { reset: resetUserInputsStore } = useUserInputsStore();

  useEffect(() => {
    resetUserInputsStore();
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
  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Navbar
        // bg="dark"
        // variant="dark"
        expand="lg"
        style={{ marginBottom: "5px", backgroundColor: "#e4e4e4" }}
      >
        <Navbar.Brand style={{ marginLeft: "10px" }}>
          <img
            src="/fire.png"
            alt="Firebay Studios"
            width="50"
            height="50"
            className="d-inline-block align-top"
          />
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse
          id="basic-navbar-nav"
          className="justify-content-between"
        >
          <Nav className="mr-auto">
            {/* Other nav links or content can go here */}
          </Nav>
          {/* This will ensure the CustomDropdown is aligned to the right */}
          <div style={{ paddingRight: "25px" }}>
            <CustomDropdown items={dropdownItems} />
          </div>
        </Navbar.Collapse>
      </Navbar>
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
            <div style={{ marginBottom: "20px" }}>
              <Link href="/create_ad" passHref>
                <button
                  style={{
                    width: "100%",
                    padding: "10px 20px",
                    fontSize: "16px",
                    cursor: "pointer",
                    backgroundColor: "#eb631c", // Custom color for the button
                    border: "none",
                    color: "white", // White text color for buttons
                    textDecoration: "none",
                    display: "inline-block",
                    margin: "4px 2px",
                    transitionDuration: "0.4s",
                    borderRadius: "12px",
                  }}
                >
                  Quick Ad Generation
                </button>
              </Link>
            </div>
            <div style={{ marginBottom: "20px" }}>
              <Link href="/create_sections" passHref>
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
      </div>
    </div>
  );
}

export default withAuth(Home);

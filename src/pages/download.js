// Relative Path: src/pages/download.js
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";

import Link from "next/link";
import "react-h5-audio-player/lib/styles.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Card, Navbar, Nav, Button } from "react-bootstrap";

import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "../context/auth";
import app from "@/firebase";
import withAuth from "@/hocs/withAuth";

import { usePostHog } from "posthog-js/react";
import SimpleAudioPlayer from "../components/SimpleAudioPlayer";
import useUserInputsStore from "../store/userInputs";

const DownloadPage = () => {
  const posthog = usePostHog();
  const router = useRouter();
  const { audioUrl } = router.query; //we need two urls for with music and without music
  const { user } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false); // Track download state
  const { reset, generatedVoiceUrl, sectionsArray, adGenerationMethod } =
    useUserInputsStore();

  useEffect(() => {
    // prevent back button
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = ""; // Chrome requires returnValue to be set
    };

    const handleBackButton = async () => {
      handleLogout();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.onpopstate = handleBackButton;

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.onpopstate = null;
    };
  }, [router]);

  const handleDownload = async () => {
    setIsDownloading(true); // Set downloading state to true

    posthog.capture("download-download-button-clicked", {
      date: new Date().toISOString(),
      userId: user.uid,
      // Additional properties can be added here if needed
    });

    // Ensure user is logged in
    if (user && user.uid) {
      const firestore = getFirestore(app);
      const docRef = doc(firestore, "uid_to_org", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().monthly_downloads !== undefined) {
        // Increment only if monthly_downloads field exists
        await updateDoc(docRef, {
          monthly_downloads: docSnap.data().monthly_downloads + 1,
        });
      }
    }
  };

  const handleNewAd = () => {
    reset();
    router.push("/dashboard");
    if (generatedVoiceUrl) {
      URL.revokeObjectURL(generatedVoiceUrl);
    }
    URL.revokeObjectURL(audioUrl);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  const filename = "generated_ad.mp3";

  const handleDownloadClick = (e) => {
    if (isDownloading) {
      e.preventDefault(); // Prevent multiple downloads
    } else {
      handleDownload();
    }
  };

  const handleChangeMusic = () => {
    posthog.capture("download-change-music-clicked", {
      date: new Date().toISOString(),
      userId: user.uid,
      // Additional properties can be added here if needed
    });

    router.push("/add-music");
  };

  // const handleChangeScriptOrVoice = () => {
  //   posthog.capture("download-change-script-or-voice-clicked", {
  //     date: new Date().toISOString(),
  //     userId: user.uid,
  //     // Additional properties can be added here if needed
  //   });

  //   router.push("/quick-mode/script-to-ad/create-ad");
  // };

  const handleChangeScriptOrVoice = () => {
    posthog.capture("download-change-script-or-voice-clicked", {
      date: new Date().toISOString(),
      userId: user.uid,
      // Additional properties can be added here if needed
    });
    // Additional logic can be executed here before redirecting
    const redirectUrl =
      adGenerationMethod === "voice-to-ad"
        ? "/quick-mode/voice-to-ad/create-ad"
        : "/quick-mode/script-to-ad/create-ad";

    // Navigate to the new page
    router.push(redirectUrl);
  };

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
        expand="lg"
        style={{ marginBottom: "5px", backgroundColor: "#e4e4e4" }} // Set the navbar background to #e4e4e4
      >
        <Navbar.Brand style={{ marginLeft: "10px" }}>
          <img
            src="/fire.png"
            width="50"
            height="50"
            className="d-inline-block align-top"
          />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">{/* Nav items here */}</Nav>
        </Navbar.Collapse>
        <Button
          variant="light"
          size="sm"
          onClick={handleLogout}
          style={{
            marginRight: "10px",
            padding: "5px 10px",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <i
            className="bi bi-box-arrow-right"
            style={{ marginRight: "5px" }}
          ></i>
          Logout
        </Button>
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
            backgroundColor: "transparent", // Set background to transparent for the entire card
            border: "1px solid #343a40", // Add border for the entire card
            color: "black", // Text color for the entire card
          }}
        >
          <Card.Header
            style={{
              padding: "16px",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <h1 style={{ fontSize: "24px", margin: 0 }}>Download Manager</h1>
          </Card.Header>
          <Card.Body
            style={{
              paddingTop: "20px",
              paddingBottom: "20px",
              flex: "1",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-around",
            }}
          >
            <div style={{ marginBottom: "20px" }}>
              <h5
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.2)",
                  paddingBottom: "10px",
                  marginBottom: "20px",
                  fontSize: "18px",
                }}
              >
                Got what you came for?
              </h5>
              <a
                href={audioUrl}
                download={filename}
                onClick={handleDownloadClick}
                style={{
                  width: "100%",
                  textAlign: "center",
                  padding: "10px 20px",
                  fontSize: "16px",
                  cursor: "pointer",
                  backgroundColor: "#eb631c", // Custom color
                  border: "none",
                  color: "white", // White text color for buttons
                  textDecoration: "none",
                  display: "inline-block",
                  margin: "4px 2px",
                  transitionDuration: "0.4s",
                  borderRadius: "12px",
                }}
              >
                <i className="bi bi-download"></i> Download
              </a>
            </div>
            <div style={{ marginBottom: "20px" }}>
              <h5
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.2)",
                  paddingBottom: "10px",
                  marginBottom: "20px",
                  fontSize: "18px",
                }}
              >
                Need more tweaking?
              </h5>
              <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
                <li style={{ marginBottom: "12px" }}>
                  <Link href="/add-music" passHref>
                    <button
                      style={{
                        width: "100%",
                        padding: "10px 20px",
                        fontSize: "16px",
                        cursor: "pointer",
                        backgroundColor: "#eb631c", // Custom color
                        border: "none",
                        color: "white", // White text color for buttons
                        textDecoration: "none",
                        display: "inline-block",
                        margin: "4px 2px",
                        transitionDuration: "0.4s",
                        borderRadius: "12px",
                      }}
                      onClick={handleChangeMusic}
                    >
                      Change Music
                    </button>
                  </Link>
                </li>
                <li style={{ marginBottom: "12px" }}>
                  {sectionsArray.length === 0 && (
                    <button
                      style={{
                        width: "100%",
                        padding: "10px 20px",
                        fontSize: "16px",
                        cursor: "pointer",
                        backgroundColor: "#eb631c", // Custom color
                        border: "none",
                        color: "white", // White text color for buttons
                        textDecoration: "none",
                        display: "inline-block",
                        margin: "4px 2px",
                        transitionDuration: "0.4s",
                        borderRadius: "12px",
                      }}
                      onClick={handleChangeScriptOrVoice}
                    >
                      {adGenerationMethod === "voice-to-ad"
                        ? "Change Your Voice"
                        : "Change Your Script"}
                    </button>
                  )}
                </li>
              </ul>
            </div>
            <div>
              <h5
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.2)",
                  paddingBottom: "10px",
                  marginBottom: "20px",
                  fontSize: "18px",
                }}
              >
                Start from scratch?
              </h5>
              <button
                style={{
                  width: "100%",
                  padding: "10px 20px",
                  fontSize: "16px",
                  cursor: "pointer",
                  backgroundColor: "#eb631c", // Custom color
                  border: "none",
                  color: "white", // White text color for buttons
                  textDecoration: "none",
                  display: "inline-block",
                  margin: "4px 2px",
                  transitionDuration: "0.4s",
                  borderRadius: "12px",
                }}
                onClick={handleNewAd}
              >
                Dashboard
              </button>
            </div>
          </Card.Body>
          <Card.Footer
            style={{
              borderTop: "1px solid rgba(255,255,255,0.1)",
              padding: "12px 16px",
            }}
          >
            {/* Footer Content */}
          </Card.Footer>
        </Card>
      </div>

      {/* {credits.creditLeft > 0 && ( */}
      <div>
        <SimpleAudioPlayer audioTitle="" audioSrc={audioUrl} />
      </div>
      {/* )} */}
    </div>
  );
};

export default withAuth(DownloadPage);

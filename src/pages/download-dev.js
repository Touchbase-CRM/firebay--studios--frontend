// pages/index.js
import React from "react";
import { useRouter } from "next/router";
import ActionCard from "@/_pages/options/components/action-card";

import { useState, useEffect } from "react";

import Link from "next/link";
import "react-h5-audio-player/lib/styles.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Card, Navbar, Nav, Button } from "react-bootstrap";

import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "../context/auth";
import app from "@/firebase";
import withAuth from "@/hocs/with-auth";

import { usePostHog } from "posthog-js/react";
import SimpleAudioPlayer from "../components/simple-audio-player";
import useUserInputsStore from "@/store/user-inputs";

const DownloadManager = () => {
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

  const handleBackClick = () => {
    router.push("/add-music");
  };

  const handleQuickAdClick = () => {
    console.log("Quick Ad clicked!");
  };

  const handleAdvancedAdClick = () => {
    console.log("Advanced Ad clicked!");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "#FFFFFF",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
        }}
      >
        <h2
          style={{
            fontSize: "1.5em",
            fontWeight: "bold",
            textAlign: "left",
            marginBottom: "30px",
          }}
        >
          What would you like to do?
        </h2>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <ActionCard
            icon="bi bi-download"
            title="Download your ad"
            description="When you download, it will count as a credit."
            link="#"
            onLinkClick={handleDownloadClick}
            linkLabel={isDownloading ? "Downloading..." : "Download"}
          />
          <ActionCard
            icon="bi bi-house"
            title="Home"
            description="By clicking here, you will be brought back to the home page with your recent projects."
            link="#"
            onLinkClick={handleNewAd}
            linkLabel="Home"
          />
        </div>
        <div
          style={{
            fontSize: "1em",
            color: "#008080",
            textDecoration: "underline",
            cursor: "pointer",
            marginTop: "10px",
          }}
          onClick={handleBackClick}
        >
          Back
        </div>
      </div>
    </div>
  );
};

export default DownloadManager;

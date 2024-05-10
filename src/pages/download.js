import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import ActionCard from "@/_pages/options/components/action-card";
import "react-h5-audio-player/lib/styles.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { NavBar } from "@/components/foundation-components/nav-bar";
import SimpleAudioPlayer from "@/components/simple-audio-player";
import { usePostHog } from "posthog-js/react";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "../context/auth";
import app from "@/firebase";
import withAuth from "@/hocs/with-auth";
import useUserInputsStore from "@/store/user-inputs";

const DownloadManager = () => {
  const posthog = usePostHog();
  const router = useRouter();
  const { audioUrl } = router.query;
  const { user } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const { reset, generatedVoiceUrl } = useUserInputsStore();

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
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
    if (!audioUrl) {
      alert("Audio URL is missing.");
      setIsDownloading(false);
      return;
    }

    setIsDownloading(true);

    posthog.capture("download-download-button-clicked", {
      date: new Date().toISOString(),
      userId: user.uid,
    });

    if (user && user.uid) {
      const firestore = getFirestore(app);
      const docRef = doc(firestore, "uid_to_org", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().monthly_downloads !== undefined) {
        await updateDoc(docRef, {
          monthly_downloads: docSnap.data().monthly_downloads + 1,
        });
      }
    }

    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = "generated_ad.mp3";
    link.click();

    setIsDownloading(false);
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

  const handleDownloadClick = (e) => {
    if (isDownloading) {
      e.preventDefault();
    } else {
      handleDownload();
    }
  };

  const handleBackClick = () => {
    router.push("/add-music");
  };

  const dropdownItems = [
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
      <NavBar links={[]} dropdownItems={dropdownItems} />
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
              linkLabel="Download"
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
      <div>
        <SimpleAudioPlayer audioTitle="" audioSrc={audioUrl} />
      </div>
    </div>
  );
};

export default DownloadManager;

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import ActionCard from "@/components/action-card";
import "react-h5-audio-player/lib/styles.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { GenericModal } from "@/components/foundation-components/modal";
import { NavBar } from "@/components/foundation-components/nav-bar";
import SimpleAudioPlayer from "@/components/simple-audio-player";
import { usePostHog } from "posthog-js/react";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "../context/auth";
import app from "@/firebase";
import withAuth from "@/hocs/with-auth";
import useUserInputsStore from "@/store/user-inputs";
import { appendToFirestoreArray } from "@/utils/db-read-write-ops/update.js";
import { captureCurrentTimestamp } from "@/utils/time/current-timestamp.js";
import RenameModal from "@/components/rename-modal";

const DownloadManager = () => {
  const posthog = usePostHog();
  const router = useRouter();
  const { audioUrl } = router.query;
  const { user } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newSpotName, setNewSpotName] = useState("");
  const [showAudioPlayer, setShowAudioPlayer] = useState(true);
  const { reset, generatedVoiceUrl, spotName, setSpotName, spotId } =
    useUserInputsStore();
  const [capturedTimestamp, setCapturedTimestamp] = useState(
    captureCurrentTimestamp()
  );
  const [fileName, setFileName] = useState("");
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

  useEffect(() => {
    // Set default file name when modal is shown
    if (showModal) {
      setFileName(spotName + "--" + capturedTimestamp);
    }
  }, [showModal, spotName, capturedTimestamp]);

  const handleDownload = async () => {
    if (!audioUrl) {
      alert("Audio URL is missing.");
      setIsDownloading(false);
      return;
    }

    setIsDownloading(true);
    const timeStamp = new Date().toISOString();

    posthog.capture("download-download-button-clicked", {
      date: timeStamp,
      userId: user.uid,
      userEmail: user.email,
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
    link.download = fileName + ".mp3"; // Use the fileName state here

    appendToFirestoreArray({
      collectionName: "spots_meta_data",
      docId: spotId,
      fieldName: "downloadLogs",
      newValue: {
        downloadFileName: fileName + ".mp3",
        downloadTime: capturedTimestamp,
      },
    });

    link.click();
    setIsDownloading(false);
  };

  const handleSaveFileName = () => {
    if (!capturedTimestamp) {
      alert("Please enter a name for your download.");
      return;
    }
    handleDownload(); // Initiates the download process
    setShowModal(false); // Closes the modal immediately after download starts
    setCapturedTimestamp(captureCurrentTimestamp());
  };

  const handleNewAd = () => {
    reset();
    router.push("/home");
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
      setShowModal(true); // This will show the modal to input the file name
    }
  };

  const handleBackClick = () => {
    router.push("/add-music");
  };

  const handlePlayAdClick = () => {
    setShowAudioPlayer((prev) => !prev);
  };

  const handleRenameClick = () => {
    setShowRenameModal(true);
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
        overflow: "hidden", // Prevent scrolling
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          width: "100%",
        }}
      >
        <NavBar links={[]} dropdownItems={dropdownItems} />
      </div>
      {/* Modal for editing spot name */}
      <RenameModal
        show={showRenameModal}
        onHide={() => setShowRenameModal(false)}
        newSpotName={newSpotName}
        setNewSpotName={setNewSpotName}
        spotId={spotId}
        setSpotName={setSpotName}
      />

      <GenericModal
        show={showModal}
        onHide={() => setShowModal(false)}
        title="Enter File Name"
        saveButtonLabel="Download"
        onSave={handleSaveFileName}
      >
        <input
          type="text"
          placeholder="Enter file name"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          className="form-control"
        />
      </GenericModal>
      <div
        className="container"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundColor: "#FFFFFF",
          padding: "20px",
        }}
      >
        <div
          className="row"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <div className="col-12">
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
          </div>
          <div
            className="col-12 d-flex justify-content-center flex-wrap"
            style={{
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                flex: "1 1 200px",
                maxWidth: "250px",
                height: "220px",
              }}
            >
              <ActionCard
                icon="bi bi-play-circle"
                title="Play your spot"
                description="Click here to open or hide the audio player."
                link="#"
                onLinkClick={handlePlayAdClick}
                linkLabel="Play"
              />
            </div>
            <div
              style={{
                flex: "1 1 200px",
                maxWidth: "250px",
                height: "220px",
              }}
            >
              <ActionCard
                icon="bi bi-download"
                title="Download your spot"
                description="When you download, it will count as a credit."
                link="#"
                onLinkClick={handleDownloadClick}
                linkLabel="Download"
              />
            </div>
            <div
              style={{
                flex: "1 1 200px",
                maxWidth: "250px",
                height: "220px",
              }}
            >
              <ActionCard
                icon="bi bi-pencil-square"
                title="Rename your Spot"
                description="Click here to rename your spot."
                link="#"
                onLinkClick={handleRenameClick}
                linkLabel="Rename"
              />
            </div>
            <div
              style={{
                flex: "1 1 200px",
                maxWidth: "250px",
                height: "220px",
              }}
            >
              <ActionCard
                icon="bi bi-house"
                title="Home"
                description="By clicking here, you will be brought back to the home page with your recent spots."
                link="#"
                onLinkClick={handleNewAd}
                linkLabel="Home"
              />
            </div>
          </div>
          <div
            className="col-12"
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
      {showAudioPlayer && (
        <div>
          <SimpleAudioPlayer
            audioTitle=""
            audioSrc={audioUrl}
            setShowAudioPlayer={setShowAudioPlayer}
            autoplay={true}
          />
        </div>
      )}
    </div>
  );
};

// export default DownloadManager;
export default withAuth(DownloadManager);


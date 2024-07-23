import React, { useCallback } from "react";
import AudioPlayer, { RHAP_UI } from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";
import app from "@/firebase";
import { captureCurrentTimestamp } from "@/utils/time/current-timestamp";
import useUserInputsStore from "@/store/user-inputs";
import { appendToFirestoreArray } from "@/utils/db-read-write-ops/update.js";

export default function SimpleAudioPlayer({
  audioTitle,
  audioSrc,
  forceRender = 0,
  autoplay = false,
  allowDownload = false,
  setShowAudioPlayer, // Optional prop
}) {
  const { spotName, spotId } = useUserInputsStore();
  const capturedTimestamp = captureCurrentTimestamp();

  const downloadFileName = `${spotName}--${capturedTimestamp}.mp3`;

  const incrementMonthlyDownloads = useCallback(async () => {
    if (!allowDownload) {
      return;
    }

    const auth = getAuth(app);
    const firestore = getFirestore(app);
    const user = auth.currentUser;

    if (user) {
      const uid = user.uid;
      appendToFirestoreArray({
        collectionName: "spots_meta_data",
        docId: spotId,
        fieldName: "downloadLogs",
        newValue: {
          downloadFileName: downloadFileName,
          downloadTime: capturedTimestamp,
        },
      });
      const docRef = doc(firestore, "uid_to_org", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().monthly_downloads !== undefined) {
        await updateDoc(docRef, {
          monthly_downloads: docSnap.data().monthly_downloads + 1,
        });
      }
    }
  }, [allowDownload]);

  return (
    <div style={styles.audioPlayerContainer}>
      <div style={styles.audioPlayerContent}>
        <div style={styles.infoRow}>
          <div style={styles.audioTitle}>Now playing: {audioTitle}</div>
          {setShowAudioPlayer && (
            <button
              onClick={() => setShowAudioPlayer(false)}
              style={styles.closeBtn}
            >
              <i className="bi bi-x"></i>
            </button>
          )}
        </div>
        <AudioPlayer
          key={forceRender}
          src={audioSrc || undefined}
          autoPlay={autoplay}
          header={null}
          showJumpControls={true}
          customAdditionalControls={[]}
          customVolumeControls={[]}
          customProgressBarSection={[
            RHAP_UI.CURRENT_TIME,
            RHAP_UI.PROGRESS_BAR,
            RHAP_UI.DURATION,
          ]}
          customControlsSection={[
            RHAP_UI.ADDITIONAL_CONTROLS,
            RHAP_UI.MAIN_CONTROLS,
            RHAP_UI.VOLUME_CONTROLS,
          ]}
          progressJumpSteps={{
            forward: 2000,
            backward: 2000
          }}
          style={styles.audioPlayer}
        />
        {allowDownload && (
          <div style={styles.downloadRow}>
            <a
              href={audioSrc}
              download={downloadFileName}
              style={styles.downloadBtn}
              onClick={incrementMonthlyDownloads}
            >
              <i className="bi bi-download"></i>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  audioPlayerContainer: {
    background: "#ffffff",
    boxShadow: "0px 0px 15px rgba(0, 0, 0, 0.1)",
    borderRadius: "10px",
    margin: "10px",
    position: "fixed",
    bottom: "10px",
    width: "calc(100% - 20px)",
    maxWidth: "900px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 1000,
  },
  audioPlayerContent: {
    padding: "10px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  audioTitle: {
    fontWeight: "bold",
    color: "#333",
  },
  closeBtn: {
    fontSize: "1.5em",
    color: "black",
    background: "none",
    border: "none",
    cursor: "pointer",
  },
  downloadRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "10px",
  },
  downloadBtn: {
    fontSize: "1.5em",
    color: "#EB631C",
    textDecoration: "none",
  },
  audioPlayer: {
    background: "transparent",
    boxShadow: "none",
  },
};

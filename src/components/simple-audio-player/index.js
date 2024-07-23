import React, { useCallback } from "react";
import AudioPlayer from "react-h5-audio-player";
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

  // Enhanced increment function with additional checks
  const incrementMonthlyDownloads = useCallback(async () => {
    if (!allowDownload) {
      // Exit if downloading is not allowed
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
        // Increment only if monthly_downloads field exists
        await updateDoc(docRef, {
          monthly_downloads: docSnap.data().monthly_downloads + 1,
        });
      }
    }
  }, [allowDownload]); // Dependency on allowDownload to reinitialize if its value changes

  return (
    <div className="fixed-bottom bg-light border-top">
      <div className="container pt-2 pb-2">
        <div className="row align-items-center">
          <div className="col-8 col-md-10">
            <span>Now playing: {audioTitle}</span>
          </div>
          <div className="col-4 col-md-2 text-end">
            {setShowAudioPlayer && (
              <button
                onClick={() => setShowAudioPlayer(false)}
                className="btn btn-link"
                style={{ fontSize: "1.5em", color: "black" }}
              >
                <i className="bi bi-x"></i>
              </button>
            )}
          </div>
        </div>
        <div className="row justify-content-center">
          <div className="col-12">
            <AudioPlayer
              key={forceRender}
              src={audioSrc || undefined}
              autoPlay={autoplay}
              header={null} // Remove the header from AudioPlayer
              showJumpControls={false}
              customAdditionalControls={[]}
              customVolumeControls={[]}
            />
          </div>
        </div>
        {allowDownload && (
          <div className="row">
            <div className="col-12 text-end">
              <a
                href={audioSrc}
                download={downloadFileName}
                className="btn btn-link"
                title="Download"
                style={{ fontSize: "1.5em", color: "#EB631C" }}
                onClick={incrementMonthlyDownloads}
              >
                <i className="bi bi-download"></i>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

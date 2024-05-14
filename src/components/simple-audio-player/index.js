import React, { useCallback } from "react";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";
import app from "@/firebase";
import { captureCurrentTimestamp } from "@/utils/time/current-timestamp";
import useUserInputsStore from "@/store/user-inputs";

export default function SimpleAudioPlayer({
  audioTitle,
  audioSrc,
  forceRender = 0,
  autoplay = false,
  allowDownload = false,
}) {
  const { spotName } = useUserInputsStore();

  const downloadFileName = `${spotName}--${captureCurrentTimestamp()}.mp3`;

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
        <AudioPlayer
          key={forceRender}
          src={audioSrc || undefined}
          autoPlay={autoplay}
          header={
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                color: "black",
              }}
            >
              <span>Now playing: {audioTitle}</span>
              {allowDownload && (
                <a
                  href={audioSrc}
                  download={downloadFileName}
                  className="btn btn-link"
                  title="Download"
                  style={{
                    marginLeft: "auto",
                    fontSize: "1.5em",
                    color: "#EB631C",
                  }}
                  onClick={incrementMonthlyDownloads}
                >
                  <i className="bi bi-download"></i>
                </a>
              )}
            </div>
          }
          showJumpControls={false}
          customAdditionalControls={[]}
          customVolumeControls={[]}
        />
      </div>
    </div>
  );
}

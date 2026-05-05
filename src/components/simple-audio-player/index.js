import React, { useCallback } from "react";
import AudioPlayer, { RHAP_UI } from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import { getAuth } from "@/firebase";
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
  setShowAudioPlayer,
}) {
  const { spotName, spotId } = useUserInputsStore();
  const capturedTimestamp = captureCurrentTimestamp();
  const downloadFileName = `${spotName || "spot"}--${capturedTimestamp}.mp3`;

  const incrementMonthlyDownloads = useCallback(async () => {
    if (!allowDownload) return;
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    const user = auth.currentUser;
    if (user) {
      const uid = user.uid;
      appendToFirestoreArray({
        collectionName: "spots_meta_data",
        docId: spotId,
        fieldName: "downloadLogs",
        newValue: { downloadFileName, downloadTime: capturedTimestamp },
      });
      const docRef = doc(firestore, "uid_to_org", uid);
      const snap = await getDoc(docRef);
      if (snap.exists() && snap.data().monthly_downloads !== undefined) {
        await updateDoc(docRef, { monthly_downloads: snap.data().monthly_downloads + 1 });
      }
    }
  }, [allowDownload, spotId, downloadFileName, capturedTimestamp]);

  return (
    <>
      <style jsx global>{`
        .pyro-rhap.rhap_container {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
          font-family: var(--font-sans);
        }
        .pyro-rhap .rhap_main {
          gap: 12px;
        }
        .pyro-rhap .rhap_progress-section {
          gap: 10px;
        }
        .pyro-rhap .rhap_time {
          color: var(--text-muted);
          font-size: 12px;
          font-variant-numeric: tabular-nums;
        }
        .pyro-rhap .rhap_progress-bar {
          background-color: var(--gray-200);
          height: 4px;
          border-radius: var(--radius-full);
        }
        .pyro-rhap .rhap_progress-filled,
        .pyro-rhap .rhap_progress-indicator {
          background-color: var(--accent-500);
        }
        .pyro-rhap .rhap_progress-indicator {
          width: 12px;
          height: 12px;
          margin-left: -6px;
          top: -4px;
          box-shadow: 0 1px 3px rgba(16,24,40,0.18);
        }
        .pyro-rhap .rhap_main-controls-button,
        .pyro-rhap .rhap_volume-button {
          color: var(--text-secondary);
        }
        .pyro-rhap .rhap_main-controls-button:hover,
        .pyro-rhap .rhap_volume-button:hover {
          color: var(--text-primary);
        }
        .pyro-rhap .rhap_play-pause-button {
          color: var(--accent-500);
        }
        .pyro-rhap .rhap_volume-bar {
          background-color: var(--gray-200);
        }
        .pyro-rhap .rhap_volume-indicator {
          background-color: var(--accent-500);
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "var(--surface-card)",
          borderTop: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-md)",
          zIndex: 1000,
        }}
        role="region"
        aria-label="Audio player"
      >
        <div
          style={{
            maxWidth: "var(--max-content-width)",
            margin: "0 auto",
            padding: "var(--space-3) var(--space-6)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-4)",
          }}
        >
          <div style={{ minWidth: 0, flexShrink: 0, marginRight: "var(--space-2)" }}>
            <div
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                fontWeight: "var(--font-weight-semibold)",
              }}
            >
              Now playing
            </div>
            <div
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--text-primary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 220,
              }}
            >
              {audioTitle || "Audio preview"}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <AudioPlayer
              key={forceRender}
              className="pyro-rhap"
              src={audioSrc || undefined}
              autoPlay={autoplay}
              header={null}
              showJumpControls={false}
              customAdditionalControls={[]}
              customVolumeControls={[RHAP_UI.VOLUME]}
              customProgressBarSection={[
                RHAP_UI.CURRENT_TIME,
                RHAP_UI.PROGRESS_BAR,
                RHAP_UI.DURATION,
              ]}
              customControlsSection={[RHAP_UI.MAIN_CONTROLS, RHAP_UI.VOLUME_CONTROLS]}
              layout="horizontal-reverse"
              style={{ background: "transparent", boxShadow: "none" }}
            />
          </div>
          {allowDownload && (
            <a
              href={audioSrc}
              download={downloadFileName}
              onClick={incrementMonthlyDownloads}
              aria-label="Download audio"
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--radius-md)",
                color: "var(--text-secondary)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                flexShrink: 0,
                transition: "background-color var(--duration-base) var(--ease-out)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--gray-100)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <i className="bi bi-download" style={{ fontSize: 16 }} />
            </a>
          )}
          {setShowAudioPlayer && (
            <button
              type="button"
              onClick={() => setShowAudioPlayer(false)}
              aria-label="Close player"
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--radius-md)",
                color: "var(--text-muted)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background-color var(--duration-base) var(--ease-out)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--gray-100)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <i className="bi bi-x-lg" style={{ fontSize: 14 }} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}

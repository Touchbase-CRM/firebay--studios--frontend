import React from "react";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import "bootstrap/dist/css/bootstrap.min.css";

export default function VoiceAudioPlayer({ audioSrc, loading, voiceName }) {
  return (
    <div className="fixed-bottom bg-light border-top">
      <div className="container pt-2 pb-2">
        <div className="d-flex align-items-center justify-content-between">
          <span
            style={{
              fontSize: "24px",
              fontWeight: "400",
              color: "#555",
              marginRight: "20px",
            }}
          >
            {loading && (
              <div className="spinner-border" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            )}
          </span>
          <AudioPlayer
            src={audioSrc || undefined}
            header={<span style={{ color: "black" }}>{voiceName}</span>}
            showJumpControls={false}
            customAdditionalControls={[]}
            customVolumeControls={[]}
          />
        </div>
      </div>
    </div>
  );
}

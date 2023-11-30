import React from "react";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import "bootstrap/dist/css/bootstrap.min.css";

function toTitleCase(str) {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export default function SimpleAudioPlayer({ audioTitle, audioSrc }) {
  return (
    <div className="fixed-bottom bg-light border-top">
      <div className="container pt-2 pb-2">
        <AudioPlayer
          src={audioSrc || undefined}
          header={
            <span style={{ color: "black" }}>
              Now playing: {toTitleCase(audioTitle)}
            </span>
          }
          showJumpControls={false}
          customAdditionalControls={[]}
          customVolumeControls={[]}
        />
      </div>
    </div>
  );
}

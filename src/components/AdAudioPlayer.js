import React from "react";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import "bootstrap/dist/css/bootstrap.min.css";

export default function AdAudioPlayer({
  src,
  onDownloadButtonClick,
  isDownloading,
}) {
  const filename = "generated_ad.mp3";

  const handleDownloadClick = (e) => {
    if (isDownloading) {
      e.preventDefault(); // Prevent multiple downloads
    } else if (onDownloadClick) {
      onDownloadClick();
    }
  };

  return (
    <div className="fixed-bottom bg-light border-top">
      <div className="container pt-2 pb-2">
        <div className="d-flex align-items-center justify-content-between">
          <AudioPlayer
            src={src || undefined}
            showJumpControls={false}
            customAdditionalControls={[]}
            customVolumeControls={[]}
            style={{ width: "80%" }}
          />
          <a
            href={src}
            download={filename}
            onClick={onDownloadButtonClick}
            style={{
              marginLeft: "10px",
              color: isDownloading ? "#aaa" : "#000",
              fontSize: "30px",
              pointerEvents: isDownloading ? "none" : "auto",
            }}
            aria-disabled={isDownloading}
          >
            <i className="bi bi-download"></i>
          </a>
        </div>
      </div>
    </div>
  );
}

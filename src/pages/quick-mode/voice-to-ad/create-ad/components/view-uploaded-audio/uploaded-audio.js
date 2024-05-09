// Relative path: src/components/viewUploadedAudio/uploadedAudio.js
import React from "react";

const ViewUploadedAudio = ({
  fileName,
  fileLength,
  fileSize,
  onPlay, // This prop is a callback function passed from the parent
  onRemove,
}) => {
  return (
    <div
      style={{
        position: "relative", // This ensures the button is absolutely positioned within this div
        border: "1px solid #EB631C",
        borderRadius: "4px",
        padding: "10px", // Make sure this padding accounts for the space the close button will occupy
        paddingTop: "30px", // Add extra padding to the top for the close button
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        maxWidth: "400px",
        margin: "10px 0",
        backgroundColor: "#f9f9f9",
      }}
    >
      <button
        onClick={onRemove}
        style={{
          position: "absolute",
          top: "5px",
          right: "5px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontSize: "20px",
          color: "#EB631C",
          lineHeight: "1",
          padding: "0",
        }}
      >
        &#215;{" "}
        {/* This is the HTML entity code for the multiplication sign, used as a close icon */}
      </button>
      <div style={{ flex: "1 1 auto" }}>
        <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
          {fileName}
        </div>
        <div style={{ color: "#666" }}>
          {fileLength} | {fileSize}
        </div>
      </div>
      <div style={{ flex: "0 0 auto" }}>
        <button
          onClick={() => onPlay()}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          <i
            className="bi bi-play-fill"
            style={{ color: "#EB631C", fontSize: "24px" }}
          ></i>
        </button>
      </div>
    </div>
  );
};

export default ViewUploadedAudio;

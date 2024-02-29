import React, { useState } from "react";
import Tooltip from "react-bootstrap/Tooltip";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";

export const CopyBox = ({ text }) => {
  const [hasCopied, setHasCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 500);
      })
      .catch(() => {
        setHasCopied(false);
      });
  };

  const renderTooltip = (props) => (
    <Tooltip {...props}>
      {hasCopied ? "Copied!" : "Copy the mock script"}
    </Tooltip>
  );

  return (
    <div
      style={{
        position: "relative",
        backgroundColor: "#f8f9fa",
        padding: "15px",
        borderRadius: "5px",
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: "16px",
        marginTop: "20px",
        marginBottom: "20px",
        width: "550px",
      }}
    >
      {text}
      <OverlayTrigger placement="top" overlay={renderTooltip}>
        <button
          onClick={copyToClipboard}
          style={{
            backgroundColor: "transparent",
            borderColor: "transparent",
            color: "currentColor",
            padding: "0",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            position: "absolute",
            top: "2px",
            right: "2px",
            width: "25px",
            height: "25px",
          }}
          className="btn"
        >
          <i
            className={
              hasCopied ? "bi bi-clipboard2-check-fill" : "bi bi-clipboard2"
            }
            style={{
              color: "#EB631C",
              fontSize: "1rem",
            }}
          ></i>
        </button>
      </OverlayTrigger>
    </div>
  );
};

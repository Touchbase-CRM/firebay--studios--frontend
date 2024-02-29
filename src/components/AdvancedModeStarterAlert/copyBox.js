import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import Tooltip from "react-bootstrap/Tooltip";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";

export const CopyBox = ({ text }) => {
  const [hasCopied, setHasCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 200);
      })
      .catch(() => {
        // Handle copy error
        setHasCopied(false);
      });
  };

  // Tooltip component
  const renderTooltip = (props) => (
    <Tooltip {...props}>Copy the mock script</Tooltip>
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
        <Button
          variant="outline-secondary"
          size="sm"
          style={{
            position: "absolute",
            top: "2px",
            right: "2px",
            backgroundColor: "#EB631C",
            color: "#0c5460",
            borderColor: "#EB631C",
            width: "25px",
            height: "25px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 0,
          }}
          onClick={copyToClipboard}
        >
          {hasCopied ? (
            <i
              className="bi bi-clipboard-check-fill"
              style={{ color: "white" }}
            ></i>
          ) : (
            <i className="bi bi-clipboard-check" style={{ color: "white" }}></i>
          )}
        </Button>
      </OverlayTrigger>
    </div>
  );
};

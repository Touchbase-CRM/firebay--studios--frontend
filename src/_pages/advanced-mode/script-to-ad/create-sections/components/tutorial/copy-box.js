import React, { useState } from "react";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

export const CopyBox = ({ text }) => {
  const [hasCopied, setHasCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 1100);
      })
      .catch(() => setHasCopied(false));
  };

  const tooltip = (props) => (
    <Tooltip {...props}>{hasCopied ? "Copied" : "Copy example"}</Tooltip>
  );

  return (
    <div
      style={{
        position: "relative",
        backgroundColor: "var(--gray-100)",
        border: "1px solid var(--border-subtle)",
        padding: "var(--space-3) var(--space-9) var(--space-3) var(--space-3)",
        borderRadius: "var(--radius-md)",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-sm)",
        color: "var(--text-primary)",
        lineHeight: 1.55,
      }}
    >
      {text}
      <OverlayTrigger placement="top" overlay={tooltip}>
        <button
          type="button"
          onClick={copyToClipboard}
          aria-label="Copy"
          style={{
            backgroundColor: "transparent",
            border: "none",
            position: "absolute",
            top: 6,
            right: 6,
            width: 28,
            height: 28,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: hasCopied ? "var(--success-500)" : "var(--text-muted)",
            cursor: "pointer",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <i className={hasCopied ? "bi bi-clipboard2-check-fill" : "bi bi-clipboard2"} />
        </button>
      </OverlayTrigger>
    </div>
  );
};

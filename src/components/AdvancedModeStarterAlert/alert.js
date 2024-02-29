import React, { useState } from "react";
import Alert from "react-bootstrap/Alert";
import { CopyBox } from "./copyBox";
export const AdvancedModeStarterAlert = () => {
  return (
    <Alert
      variant="info"
      style={{
        backgroundColor: "#d1ecf1",
        borderColor: "#bee5eb",
        padding: "20px",
        borderRadius: "5px",
        color: "#0c5460",
      }}
    >
      {/* Reusable boxes with different texts */}
      <CopyBox text="The quick brown fox jumps over the lazy dog." />
      <CopyBox text="The quick brown fox// jumps over the lazy dog." />
      {/* You can add more <CopyBox /> components as needed */}
    </Alert>
  );
};

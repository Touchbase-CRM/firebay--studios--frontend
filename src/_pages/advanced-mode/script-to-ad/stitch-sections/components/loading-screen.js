import React from "react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

const LoadingScreen = ({ cancelLoading, cancelAndRetryLoading }) => {
  return (
    <div
      style={{
        height: "100vh",
        backgroundColor: "var(--surface-canvas)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-6)",
        padding: "var(--space-6)",
      }}
    >
      <Spinner size="xl" />
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <h2
          style={{
            fontSize: "var(--text-xl)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--text-primary)",
            margin: 0,
            marginBottom: "var(--space-2)",
          }}
        >
          Cooking up your final cut
        </h2>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", margin: 0 }}>
          We're stitching your sections together. This usually takes a few seconds.
        </p>
      </div>
      <div>
        <Button variant="secondary" onClick={cancelAndRetryLoading || cancelLoading}>
          Cancel and retry
        </Button>
      </div>
    </div>
  );
};

export default LoadingScreen;

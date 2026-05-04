import React from "react";

export function PageShell({ children, style }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--surface-canvas)",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function PageContent({ children, maxWidth = "var(--max-content-width)", style }) {
  return (
    <main
      style={{
        flex: 1,
        width: "100%",
        maxWidth,
        margin: "0 auto",
        padding: "var(--space-6) var(--space-6) var(--space-9)",
        ...style,
      }}
    >
      {children}
    </main>
  );
}

export default PageShell;

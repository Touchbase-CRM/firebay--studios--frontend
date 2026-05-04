import React from "react";

const sizes = { sm: 16, md: 20, lg: 32, xl: 48 };

export function Spinner({ size = "md", color = "var(--accent-500)", style }) {
  const px = typeof size === "number" ? size : sizes[size] || sizes.md;
  const border = Math.max(2, Math.round(px / 8));
  return (
    <span
      role="status"
      aria-label="Loading"
      style={{
        display: "inline-block",
        width: px,
        height: px,
        border: `${border}px solid var(--gray-200)`,
        borderTopColor: color,
        borderRadius: "var(--radius-full)",
        animation: "pyro-spin 0.7s linear infinite",
        ...style,
      }}
    >
      <style>{`@keyframes pyro-spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}

export default Spinner;

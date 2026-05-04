import React from "react";

const tones = {
  neutral: { bg: "var(--gray-100)", color: "var(--text-secondary)" },
  accent: { bg: "var(--accent-50)", color: "var(--accent-700)" },
  success: { bg: "var(--success-50)", color: "var(--success-600)" },
  warning: { bg: "var(--warning-50)", color: "var(--warning-600)" },
  danger: { bg: "var(--danger-50)", color: "var(--danger-600)" },
  info: { bg: "var(--info-50)", color: "var(--info-600)" },
};

export function Badge({ tone = "neutral", children, style, ...rest }) {
  const palette = tones[tone] || tones.neutral;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-1)",
        backgroundColor: palette.bg,
        color: palette.color,
        fontSize: "var(--text-xs)",
        fontWeight: "var(--font-weight-medium)",
        padding: "2px var(--space-2)",
        borderRadius: "var(--radius-sm)",
        whiteSpace: "nowrap",
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}

export default Badge;

import React from "react";

export function Toolbar({
  title,
  description,
  actions,
  align = "between",
  style,
  children,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: align === "between" ? "space-between" : align,
        gap: "var(--space-4)",
        padding: "var(--space-4) var(--space-6)",
        ...style,
      }}
    >
      {(title || description) && (
        <div style={{ minWidth: 0 }}>
          {title && (
            <div
              style={{
                fontSize: "var(--text-2xl)",
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--text-primary)",
                lineHeight: "var(--text-2xl-lh)",
                letterSpacing: "var(--letter-spacing-tight)",
              }}
            >
              {title}
            </div>
          )}
          {description && (
            <div
              style={{
                marginTop: "var(--space-1)",
                fontSize: "var(--text-sm)",
                color: "var(--text-secondary)",
              }}
            >
              {description}
            </div>
          )}
        </div>
      )}
      {children}
      {actions && (
        <div style={{ display: "flex", gap: "var(--space-2)", flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  );
}

export default Toolbar;

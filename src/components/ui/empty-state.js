import React from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
  style,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "var(--space-9) var(--space-6)",
        gap: "var(--space-3)",
        ...style,
      }}
    >
      {icon && (
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "var(--radius-full)",
            backgroundColor: "var(--gray-100)",
            color: "var(--text-muted)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            marginBottom: "var(--space-2)",
          }}
        >
          {icon}
        </div>
      )}
      {title && (
        <div
          style={{
            fontSize: "var(--text-md)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--text-primary)",
          }}
        >
          {title}
        </div>
      )}
      {description && (
        <div
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--text-secondary)",
            maxWidth: 360,
          }}
        >
          {description}
        </div>
      )}
      {action && <div style={{ marginTop: "var(--space-2)" }}>{action}</div>}
    </div>
  );
}

export default EmptyState;

import React from "react";

const variantStyles = {
  default: {
    backgroundColor: "var(--surface-card)",
    border: "1px solid var(--border-subtle)",
    boxShadow: "var(--shadow-xs)",
  },
  inset: {
    backgroundColor: "var(--surface-inset)",
    border: "1px solid transparent",
    boxShadow: "none",
  },
  bordered: {
    backgroundColor: "var(--surface-card)",
    border: "1px solid var(--border-strong)",
    boxShadow: "none",
  },
};

export function Card({
  variant = "default",
  padding = "var(--space-5)",
  radius = "var(--radius-lg)",
  children,
  style,
  ...rest
}) {
  return (
    <div
      style={{
        ...variantStyles[variant],
        borderRadius: radius,
        padding,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, description, actions, style, ...rest }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "var(--space-4)",
        marginBottom: "var(--space-4)",
        ...style,
      }}
      {...rest}
    >
      <div style={{ minWidth: 0 }}>
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
              marginTop: "var(--space-1)",
              fontSize: "var(--text-sm)",
              color: "var(--text-secondary)",
            }}
          >
            {description}
          </div>
        )}
      </div>
      {actions && (
        <div style={{ flexShrink: 0, display: "flex", gap: "var(--space-2)" }}>
          {actions}
        </div>
      )}
    </div>
  );
}

export default Card;

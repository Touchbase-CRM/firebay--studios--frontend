import React from "react";

export function Tabs({ value, onChange, items, style }) {
  return (
    <div
      role="tablist"
      style={{
        display: "flex",
        gap: "var(--space-5)",
        borderBottom: "1px solid var(--border-subtle)",
        ...style,
      }}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            type="button"
            key={item.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            disabled={item.disabled}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              cursor: item.disabled ? "not-allowed" : "pointer",
              padding: "var(--space-3) 0",
              marginBottom: "-1px",
              fontSize: "var(--text-sm)",
              fontWeight: active
                ? "var(--font-weight-semibold)"
                : "var(--font-weight-medium)",
              color: active ? "var(--text-primary)" : "var(--text-muted)",
              borderBottom: active
                ? "2px solid var(--accent-500)"
                : "2px solid transparent",
              transition:
                "color var(--duration-base) var(--ease-out), border-color var(--duration-base) var(--ease-out)",
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-2)",
            }}
          >
            {item.icon}
            {item.label}
            {item.badge != null && (
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  color: active ? "var(--accent-600)" : "var(--text-muted)",
                  backgroundColor: active ? "var(--accent-50)" : "var(--gray-100)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0 var(--space-1)",
                  minWidth: "var(--space-4)",
                  textAlign: "center",
                }}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;

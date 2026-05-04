import React, { useId } from "react";

export function Toggle({
  id,
  checked,
  onChange,
  label,
  description,
  disabled = false,
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const accent = "var(--accent-500)";
  const idle = "var(--gray-300)";

  return (
    <label
      htmlFor={inputId}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "var(--space-3)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div className="form-check form-switch" style={{ paddingLeft: 0, marginTop: 2 }}>
        <input
          className="form-check-input"
          type="checkbox"
          role="switch"
          id={inputId}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          style={{
            backgroundColor: checked ? accent : "var(--surface-card)",
            borderColor: checked ? accent : idle,
            cursor: disabled ? "not-allowed" : "pointer",
            width: "2.5em",
            height: "1.4em",
            marginLeft: 0,
          }}
        />
      </div>
      {(label || description) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          {label && (
            <span
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--font-weight-medium)",
                color: "var(--text-primary)",
              }}
            >
              {label}
            </span>
          )}
          {description && (
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
}

export default Toggle;

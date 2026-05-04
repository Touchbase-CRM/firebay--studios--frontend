import React, { forwardRef, useId } from "react";
import { Form } from "react-bootstrap";

export const Input = forwardRef(function Input(
  {
    label,
    hint,
    error,
    id,
    leftAdornment,
    rightAdornment,
    style,
    containerStyle,
    ...rest
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", ...containerStyle }}>
      {label && (
        <Form.Label htmlFor={inputId} style={{ marginBottom: 0 }}>
          {label}
        </Form.Label>
      )}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {leftAdornment && (
          <div
            style={{
              position: "absolute",
              left: "var(--space-3)",
              color: "var(--text-muted)",
              pointerEvents: "none",
              display: "flex",
            }}
          >
            {leftAdornment}
          </div>
        )}
        <Form.Control
          ref={ref}
          id={inputId}
          isInvalid={!!error}
          style={{
            paddingLeft: leftAdornment ? "var(--space-8)" : undefined,
            paddingRight: rightAdornment ? "var(--space-8)" : undefined,
            ...style,
          }}
          {...rest}
        />
        {rightAdornment && (
          <div
            style={{
              position: "absolute",
              right: "var(--space-3)",
              color: "var(--text-muted)",
              display: "flex",
            }}
          >
            {rightAdornment}
          </div>
        )}
      </div>
      {error ? (
        <div style={{ fontSize: "var(--text-xs)", color: "var(--danger-500)" }}>
          {error}
        </div>
      ) : hint ? (
        <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
          {hint}
        </div>
      ) : null}
    </div>
  );
});

export default Input;

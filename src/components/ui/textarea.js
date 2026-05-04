import React, { forwardRef, useId } from "react";
import { Form } from "react-bootstrap";

export const Textarea = forwardRef(function Textarea(
  {
    label,
    hint,
    error,
    id,
    counter,
    rows = 4,
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
      <Form.Control
        as="textarea"
        ref={ref}
        id={inputId}
        rows={rows}
        isInvalid={!!error}
        style={{ resize: "vertical", ...style }}
        {...rest}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "var(--space-2)",
          minHeight: counter || error || hint ? "var(--space-4)" : 0,
        }}
      >
        <div style={{ fontSize: "var(--text-xs)" }}>
          {error ? (
            <span style={{ color: "var(--danger-500)" }}>{error}</span>
          ) : hint ? (
            <span style={{ color: "var(--text-muted)" }}>{hint}</span>
          ) : null}
        </div>
        {counter != null && (
          <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
            {counter}
          </div>
        )}
      </div>
    </div>
  );
});

export default Textarea;

import React, { forwardRef, useId } from "react";
import { Form } from "react-bootstrap";

export const Select = forwardRef(function Select(
  { label, hint, error, id, options, children, style, containerStyle, ...rest },
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
      <Form.Select
        ref={ref}
        id={inputId}
        isInvalid={!!error}
        style={style}
        {...rest}
      >
        {options
          ? options.map((opt) =>
              typeof opt === "string" ? (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ) : (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              )
            )
          : children}
      </Form.Select>
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

export default Select;

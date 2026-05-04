import React from "react";
import { Offcanvas } from "react-bootstrap";

export function Drawer({
  show,
  onHide,
  title,
  description,
  placement = "end",
  width = "var(--inspector-width)",
  children,
  footer,
  ...rest
}) {
  return (
    <Offcanvas
      show={show}
      onHide={onHide}
      placement={placement}
      style={{ width }}
      {...rest}
    >
      {(title || description) && (
        <Offcanvas.Header closeButton>
          <div>
            {title && <Offcanvas.Title>{title}</Offcanvas.Title>}
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
        </Offcanvas.Header>
      )}
      <Offcanvas.Body
        style={{
          padding: "var(--space-5)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
        }}
      >
        <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>{children}</div>
        {footer && (
          <div
            style={{
              borderTop: "1px solid var(--border-subtle)",
              paddingTop: "var(--space-4)",
              display: "flex",
              gap: "var(--space-2)",
              justifyContent: "flex-end",
            }}
          >
            {footer}
          </div>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
}

export default Drawer;

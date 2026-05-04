import React from "react";
import { Modal as BsModal } from "react-bootstrap";
import { Button } from "./button";

export function Modal({
  show,
  onHide,
  title,
  description,
  size = "md",
  children,
  footer,
  primaryAction,
  secondaryAction,
  hideCloseButton = false,
  centered = true,
  ...rest
}) {
  const sizeMap = { sm: "sm", md: undefined, lg: "lg", xl: "xl" };

  const computedFooter =
    footer ??
    (primaryAction || secondaryAction ? (
      <>
        {secondaryAction && (
          <Button
            variant="secondary"
            onClick={secondaryAction.onClick}
            disabled={secondaryAction.disabled}
          >
            {secondaryAction.label}
          </Button>
        )}
        {primaryAction && (
          <Button
            variant={primaryAction.variant || "primary"}
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
            loading={primaryAction.loading}
          >
            {primaryAction.label}
          </Button>
        )}
      </>
    ) : null);

  return (
    <BsModal
      show={show}
      onHide={onHide}
      size={sizeMap[size]}
      centered={centered}
      {...rest}
    >
      {(title || description) && (
        <BsModal.Header closeButton={!hideCloseButton}>
          <div>
            {title && <BsModal.Title>{title}</BsModal.Title>}
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
        </BsModal.Header>
      )}
      <BsModal.Body>{children}</BsModal.Body>
      {computedFooter && <BsModal.Footer>{computedFooter}</BsModal.Footer>}
    </BsModal>
  );
}

export default Modal;

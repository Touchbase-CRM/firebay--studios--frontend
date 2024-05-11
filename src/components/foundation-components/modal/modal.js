// Relative path: src/components/foundation-components/modal/modal.js
import React from "react";
import { Modal, Button } from "react-bootstrap";

export const GenericModal = ({
  show,
  onHide,
  title,
  children,
  closeButtonLabel = "Close",
  saveButtonLabel = "Save Changes",
  onSave,
}) => {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header
        closeButton
        style={{
          backgroundColor: "#f8f9fa",
          borderBottom: "1px solid #dee2e6",
        }}
      >
        <Modal.Title style={{ color: "#495057", fontWeight: "500" }}>
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      <Modal.Footer
        style={{ backgroundColor: "#f8f9fa", borderTop: "1px solid #dee2e6" }}
      >
        <Button
          variant="secondary"
          onClick={onHide}
          style={{
            fontWeight: "400",
            backgroundColor: "#FDA942",
            borderColor: "#FDA942",
          }}
        >
          {closeButtonLabel}
        </Button>
        <Button
          onClick={onSave}
          style={{
            fontWeight: "400",
            backgroundColor: "#eb631c",
            borderColor: "#eb631c",
          }}
        >
          {saveButtonLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

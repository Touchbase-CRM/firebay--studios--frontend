import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";

export const EditPauseDurationModal = ({
  show,
  onHide,
  initialValue,
  onSave,
}) => {
  const [value, setValue] = useState(initialValue);

  const handleSave = () => {
    onSave(value);
    onHide(); // Close modal after saving
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Edit Pause Duration</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          min="0"
          max="10"
          step="0.1"
          style={{
            width: "100%",
            backgroundColor: "#e4e4e4",
            borderColor: "#e4e4e4",
            color: "black",
          }}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

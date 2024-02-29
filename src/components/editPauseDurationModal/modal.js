import React, { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import Swal from "sweetalert2";

export const EditPauseDurationModal = ({
  show,
  onHide,
  initialValue,
  onSave,
  maxValue,
}) => {
  const [value, setValue] = useState(initialValue);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    if (show) {
      setValue(initialValue);
      setHasSaved(false);
    }
  }, [show, initialValue]);

  useEffect(() => {
    if (!show && !hasSaved) {
      setValue(initialValue);
    }
  }, [show, initialValue, hasSaved]);

  const handleValueChange = (e) => {
    const inputVal = e.target.value;
    if (inputVal === "") {
      setValue("");
      return;
    }

    const newValue = parseFloat(inputVal);
    if (!isNaN(newValue) && newValue <= maxValue) {
      setValue(newValue);
    } else if (newValue > maxValue) {
      Swal.fire({
        icon: "error",
        title: `Can't be more than ${maxValue} Sec`,
        text: "You do not have that much time left in your spot for the pause length you have asked for.",
      });
      setValue(initialValue);
    }
  };

  const handleSave = () => {
    onSave(value);
    setHasSaved(true);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{`Pause should be less than ${maxValue} Sec`}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <input
          type="number"
          value={value}
          onChange={handleValueChange}
          min="0"
          max={maxValue}
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

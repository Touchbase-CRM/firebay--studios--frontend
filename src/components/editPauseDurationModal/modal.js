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
    if (!isNaN(newValue) && newValue >= 0 && newValue <= maxValue) {
      setValue(newValue);
    } else if (newValue < 0) {
      Swal.fire({
        icon: "error",
        title:
          "<span style='font-family: Arial, sans-serif; font-weight: 600;'>Invalid Input</span>",
        html: "<span style='font-size: 16px;'>Pause duration cannot be negative.</span>",
        customClass: {
          popup: "swal-wide",
        },
        buttonsStyling: false,
        confirmButtonText: "Ok",
        confirmButtonColor: "#3085d6",
        confirmButtonClass: "btn btn-primary",
      });

      setValue(initialValue);
    } else if (newValue > maxValue) {
      Swal.fire({
        icon: "error",
        title: `<span style='font-family: Arial, sans-serif; font-weight: 600;'>Can't be more than ${maxValue} Sec</span>`,
        html: "<span style='font-size: 16px;'>You do not have that much time left in your spot for the pause length you have asked for.</span>",
        buttonsStyling: false,
        confirmButtonText: "Ok",
        confirmButtonColor: "#3085d6",
        confirmButtonClass: "btn btn-primary",
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
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header
        closeButton
        style={{
          backgroundColor: "#f8f9fa",
          borderBottom: "1px solid #dee2e6",
        }}
      >
        <Modal.Title
          style={{ color: "#495057", fontWeight: "500" }}
        >{`Pause should be less than ${maxValue} Sec`}</Modal.Title>
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
            display: "block",
            width: "100%", // Responsive width
            padding: "0.375rem 0.75rem", // Bootstrap's default padding
            fontSize: "1rem", // Larger, more readable text
            lineHeight: "1.5", // Bootstrap's default line height
            color: "#495057", // Darker text for better readability
            backgroundColor: "#fff", // White background
            backgroundClip: "padding-box",
            border: "1px solid #ced4da", // Bootstrap's default border
            borderRadius: "0.25rem", // Rounded corners
            transition:
              "border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out", // Smooth transition on focus
            marginBottom: "1rem", // Add some space below the input
          }}
        />
      </Modal.Body>
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
          Close
        </Button>
        <Button
          onClick={handleSave}
          style={{
            fontWeight: "400",
            backgroundColor: "#eb631c",
            borderColor: "#eb631c",
          }}
        >
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

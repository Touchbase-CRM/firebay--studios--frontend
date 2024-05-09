import React, { useState, useEffect } from "react";
import { GenericModal } from "@/components/foundation-components/modal";
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
    } else {
      let errorTitle =
        newValue < 0
          ? "Pause duration cannot be negative."
          : `Can't be more than ${maxValue} Sec`;
      let errorMessage =
        newValue < 0
          ? "Value must be non-negative."
          : "The value exceeds the maximum limit.";
      Swal.fire({
        icon: "error",
        title: `<span style='font-family: Arial, sans-serif; font-weight: 600;'>Invalid Input</span>`,
        html: `<span style='font-size: 16px;'>${errorMessage}</span>`,
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
    <GenericModal
      show={show}
      onHide={onHide}
      title={`Pause should be less than ${maxValue} Sec`}
      onSave={handleSave}
      closeButtonLabel="Close"
      saveButtonLabel="Save Changes"
    >
      <input
        type="number"
        value={value}
        onChange={handleValueChange}
        min="0"
        max={maxValue}
        step="0.1"
        style={{
          display: "block",
          width: "100%",
          padding: "0.375rem 0.75rem",
          fontSize: "1rem",
          lineHeight: "1.5",
          color: "#495057",
          backgroundColor: "#fff",
          backgroundClip: "padding-box",
          border: "1px solid #ced4da",
          borderRadius: "0.25rem",
          transition:
            "border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
          marginBottom: "1rem",
        }}
      />
    </GenericModal>
  );
};

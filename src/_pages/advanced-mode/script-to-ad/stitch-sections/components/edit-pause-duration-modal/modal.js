import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";

export const EditPauseDurationModal = ({
  show,
  onHide,
  initialValue,
  onSave,
  maxValue,
}) => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (show) {
      setValue(initialValue);
      setError(null);
    }
  }, [show, initialValue]);

  const handleValueChange = (e) => {
    const next = e.target.value;
    if (next === "") {
      setValue("");
      setError(null);
      return;
    }
    const parsed = parseFloat(next);
    if (isNaN(parsed)) return;
    if (parsed < 0) {
      setError("Value must be non-negative.");
      return;
    }
    if (parsed > maxValue) {
      setError(`Can't exceed ${maxValue}s.`);
      return;
    }
    setError(null);
    setValue(parsed);
  };

  const handleSave = () => {
    if (error) return;
    onSave(value);
    onHide();
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      title="Edit pause"
      description={`Pause must be 0–${maxValue}s.`}
      primaryAction={{ label: "Save", onClick: handleSave, disabled: !!error }}
      secondaryAction={{ label: "Cancel", onClick: onHide }}
    >
      <Input
        type="number"
        autoFocus
        value={value}
        onChange={handleValueChange}
        min={0}
        max={maxValue}
        step={0.1}
        error={error}
        rightAdornment={<span style={{ fontSize: "var(--text-xs)" }}>seconds</span>}
      />
    </Modal>
  );
};

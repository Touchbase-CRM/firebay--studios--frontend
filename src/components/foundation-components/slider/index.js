import React, { useState, useEffect, useRef } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

const FireSlider = ({
  min = 0,
  max = 100,
  width = "100%",
  height = "10px",
  containerStyle = {},
  thumbColor = "#eb631c", // default thumb color
  trackColor = "#f0f0f0", // lighter default track color
  fillColor = "#eb631c", // default fill color
  showPercentage = false, // flag for showing percentage
  disabled = false, // flag for disabling the slider
  value,
  onValueChange, // handler for the final value change
}) => {
  const [tempValue, setTempValue] = useState(value);
  const [showTooltip, setShowTooltip] = useState(false);
  const sliderRef = useRef(null);
  const thumbRef = useRef(null);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleMouseUp = () => {
    onValueChange(tempValue);
    setShowTooltip(false);
  };

  const handleMouseDown = () => {
    setShowTooltip(true);
  };

  const handleChange = (event) => {
    const newValue = event.target.value;
    setTempValue(newValue);
  };

  const calculateThumbPosition = () => {
    if (sliderRef.current) {
      const slider = sliderRef.current;
      const percent = (tempValue - min) / (max - min);
      const thumbOffset = percent * slider.offsetWidth;
      return thumbOffset - thumbRef.current.offsetWidth / 2;
    }
    return 0;
  };

  const formatTooltipValue = (value) => {
    return showPercentage ? `${Math.round(value)}%` : value;
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      const thumbStyle = {
        WebkitAppearance: "none",
        appearance: "none",
        width: "20px",
        height: "20px",
        background: thumbColor,
        cursor: disabled ? "not-allowed" : "pointer",
        borderRadius: `${parseInt(height) / 2}px`, // Rounded edges
        position: "relative",
        top: `${parseInt(height) / 2 - 10}px`, // Adjust to align properly
        border: "2px solid white",
        transition: "transform 0.3s", // Add transition for animation
      };

      const thumbHoverStyle = disabled
        ? {}
        : {
            transform: "scale(1.2)", // Scale up on hover
          };

      const styleElement = document.createElement("style");
      styleElement.innerHTML = `
        input[type='range'] {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          background: linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${
        ((value - min) / (max - min)) * 100
      }%, ${trackColor} ${
        ((value - min) / (max - min)) * 100
      }%, ${trackColor} 100%);
          height: ${height};
          border-radius: ${parseInt(height) / 2}px; // Rounded edges
          cursor: ${disabled ? "not-allowed" : "pointer"};
        }
  
        input[type='range']:focus {
          outline: none;
        }
  
        input[type='range']::-webkit-slider-runnable-track {
          width: 100%;
          height: ${height};
          background: transparent;
          border-radius: ${parseInt(height) / 2}px; // Rounded edges
          cursor: ${disabled ? "not-allowed" : "pointer"};
        }
  
        input[type='range']::-moz-range-track {
          width: 100%;
          height: ${height};
          background: transparent;
          border-radius: ${parseInt(height) / 2}px; // Rounded edges
          cursor: ${disabled ? "not-allowed" : "pointer"};
        }
  
        input[type='range']::-webkit-slider-thumb {
          ${Object.entries(thumbStyle)
            .map(([key, value]) => `${key}: ${value};`)
            .join(" ")}
          margin-top: 0px; /* Offset for the thumb */
        }
  
        input[type='range']::-webkit-slider-thumb:hover {
          ${Object.entries(thumbHoverStyle)
            .map(([key, value]) => `${key}: ${value};`)
            .join(" ")}
        }
  
        input[type='range']::-moz-range-thumb {
          ${Object.entries(thumbStyle)
            .map(([key, value]) => `${key}: ${value};`)
            .join(" ")}
        }
  
        input[type='range']::-moz-range-thumb:hover {
          ${Object.entries(thumbHoverStyle)
            .map(([key, value]) => `${key}: ${value};`)
            .join(" ")}
        }
      `;
      document.head.appendChild(styleElement);

      return () => {
        document.head.removeChild(styleElement);
      };
    }
  }, [thumbColor, trackColor, height, fillColor, value, min, max, disabled]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const slider = document.querySelector("input[type='range']");
      slider.style.background = `linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${
        ((tempValue - min) / (max - min)) * 100
      }%, ${trackColor} ${
        ((tempValue - min) / (max - min)) * 100
      }%, ${trackColor} 100%)`;
    }
  }, [tempValue, fillColor, trackColor, min, max]);

  return (
    <div
      style={{ ...styles.sliderContainer, width, ...containerStyle }}
      ref={sliderRef}
    >
      <OverlayTrigger
        placement="top"
        show={showTooltip}
        overlay={
          <Tooltip id="slider-tooltip">{formatTooltipValue(tempValue)}</Tooltip>
        }
        popperConfig={{
          modifiers: [
            {
              name: "offset",
              options: {
                offset: [calculateThumbPosition(), 8], // Adjust as needed
              },
            },
          ],
        }}
      >
        <input
          type="range"
          ref={thumbRef}
          style={{ ...styles.slider, height }}
          min={min}
          max={max}
          value={tempValue}
          onChange={handleChange}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          disabled={disabled}
        />
      </OverlayTrigger>
    </div>
  );
};

const styles = {
  sliderContainer: {
    display: "flex",
    alignItems: "center",
    position: "relative",
  },
  slider: {
    WebkitAppearance: "none",
    appearance: "none",
    background: "transparent",
    outline: "none",
    opacity: "1", // Set to 1 for full opacity
    transition: "opacity .2s",
    position: "relative",
  },
};

export default FireSlider;

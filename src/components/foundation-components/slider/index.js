import React, { useState, useEffect, useRef } from "react";
import { OverlayTrigger, Tooltip, Button } from "react-bootstrap";

const FireSlider = ({
  min = 0,
  max = 100,
  width = "100%",
  height = "6px",
  containerStyle = {},
  thumbColor = "var(--accent-500)",
  trackColor = "var(--gray-200)",
  fillColor = "var(--accent-500)",
  showPercentage = false, // flag for showing percentage
  disabled = false, // flag for disabling the slider
  value,
  onValueChange, // handler for the final value change
  leftInfoMessage = "", // optional — render only when truthy
  rightInfoMessage = "", // optional — render only when truthy
  reset, // optional reset callback
}) => {
  const [tempValue, setTempValue] = useState(value);
  const [showTooltip, setShowTooltip] = useState(false);
  const sliderRef = useRef(null);
  const thumbRef = useRef(null);

  const uniqueClassName = `fire-slider-${Math.random()
    .toString(36)
    .substring(2, 15)}`;

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
    return showPercentage ? `${Math.ceil(value)}%` : value;
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      const thumbStyle = `
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        background: ${thumbColor};
        cursor: ${disabled ? "not-allowed" : "pointer"};
        border-radius: 50%;
        position: relative;
        top: ${parseInt(height) / 2 - 8}px;
        border: 2px solid white;
        box-shadow: 0 1px 3px rgba(16,24,40,0.18);
        transition: transform 0.15s ease-out;
      `;

      const thumbHoverStyle = disabled
        ? ""
        : `
        transform: scale(1.12);
      `;

      const styleElement = document.createElement("style");
      styleElement.innerHTML = `
        .${uniqueClassName} input[type='range'] {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          background: linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${
        ((value - min) / (max - min)) * 100
      }%, ${trackColor} ${
        ((value - min) / (max - min)) * 100
      }%, ${trackColor} 100%);
          height: ${height};
          border-radius: ${parseInt(height) / 2}px;
          cursor: ${disabled ? "not-allowed" : "pointer"};
        }
  
        .${uniqueClassName} input[type='range']:focus {
          outline: none;
        }
  
        .${uniqueClassName} input[type='range']::-webkit-slider-runnable-track {
          width: 100%;
          height: ${height};
          background: transparent;
          border-radius: ${parseInt(height) / 2}px;
          cursor: ${disabled ? "not-allowed" : "pointer"};
        }
  
        .${uniqueClassName} input[type='range']::-moz-range-track {
          width: 100%;
          height: ${height};
          background: transparent;
          border-radius: ${parseInt(height) / 2}px;
          cursor: ${disabled ? "not-allowed" : "pointer"};
        }
  
        .${uniqueClassName} input[type='range']::-webkit-slider-thumb {
          ${thumbStyle}
        }
  
        .${uniqueClassName} input[type='range']::-webkit-slider-thumb:hover {
          ${thumbHoverStyle}
        }
  
        .${uniqueClassName} input[type='range']::-moz-range-thumb {
          ${thumbStyle}
        }
  
        .${uniqueClassName} input[type='range']::-moz-range-thumb:hover {
          ${thumbHoverStyle}
        }
  
        .${uniqueClassName} input[type='range']::-ms-thumb {
          ${thumbStyle}
        }
  
        .${uniqueClassName} input[type='range']::-ms-thumb:hover {
          ${thumbHoverStyle}
        }
      `;
      document.head.appendChild(styleElement);

      return () => {
        document.head.removeChild(styleElement);
      };
    }
  }, [
    thumbColor,
    trackColor,
    height,
    fillColor,
    value,
    min,
    max,
    disabled,
    uniqueClassName,
  ]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const slider = document.querySelector(
        `.${uniqueClassName} input[type='range']`
      );
      slider.style.background = `linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${
        ((tempValue - min) / (max - min)) * 100
      }%, ${trackColor} ${
        ((tempValue - min) / (max - min)) * 100
      }%, ${trackColor} 100%)`;
    }
  }, [tempValue, fillColor, trackColor, min, max, uniqueClassName]);

  return (
    <div
      className={uniqueClassName}
      style={{ ...styles.sliderContainer, width, ...containerStyle }}
      ref={sliderRef}
    >
      {leftInfoMessage && (
        <div style={styles.leftInfoIconContainer}>
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip id="left-tooltip">{leftInfoMessage}</Tooltip>}
          >
            <i className="bi bi-info-circle" style={styles.infoIcon}></i>
          </OverlayTrigger>
        </div>
      )}
      {rightInfoMessage && (
        <div style={styles.rightInfoIconContainer}>
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip id="right-tooltip">{rightInfoMessage}</Tooltip>}
          >
            <i className="bi bi-info-circle" style={styles.infoIcon}></i>
          </OverlayTrigger>
        </div>
      )}
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
          style={{
            ...styles.slider,
            height,
            WebkitAppearance: "none",
            appearance: "none",
            background: "transparent",
            outline: "none",
            opacity: "1", // Set to 1 for full opacity
            transition: "opacity .2s",
            position: "relative",
            width: "100%",
            cursor: disabled ? "not-allowed" : "pointer",
            borderRadius: "0px", // Square edges for the track as well
          }}
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
      {reset && (
        <div style={{ position: "absolute", right: -29, bottom: -4 }}>
          <Button
            variant="link"
            onClick={() => reset(0)}
            style={{
              color: "var(--accent-500)",
              textDecoration: "underline",
              padding: 0,
              fontSize: "11px",
            }}
          >
            reset
          </Button>
        </div>
      )}
    </div>
  );
};

const styles = {
  sliderContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
  },
  leftInfoIconContainer: {
    position: "absolute",
    left: "0px",
    top: "-30px", // Adjust this value to position it above the slider
  },
  rightInfoIconContainer: {
    position: "absolute",
    right: "0px",
    top: "-30px", // Adjust this value to position it above the slider
  },
  slider: {
    WebkitAppearance: "none",
    appearance: "none",
    background: "transparent",
    outline: "none",
    opacity: "1", // Set to 1 for full opacity
    transition: "opacity .2s",
    position: "relative",
    width: "100%",
  },
  infoIcon: {
    cursor: "pointer",
  },
};

export default FireSlider;

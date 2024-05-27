import React, { useState, useEffect } from "react";

const SliderComponent = ({
  min = 0,
  max = 100,
  width = "100%",
  height = "10px",
  containerStyle = {},
  thumbColor = "#eb631c", // default thumb color
  trackColor = "#f0f0f0", // lighter default track color
  fillColor = "#eb631c", // default fill color
}) => {
  const [value, setValue] = useState((min + max) / 2);
  const [tempValue, setTempValue] = useState(value);

  const handleMouseUp = () => {
    setValue(tempValue);
  };

  const handleChange = (event) => {
    setTempValue(event.target.value);
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      const thumbStyle = {
        WebkitAppearance: "none",
        appearance: "none",
        width: "20px",
        height: "20px",
        background: thumbColor,
        cursor: "pointer",
        borderRadius: "50%",
        position: "relative",
        top: `${parseInt(height) / 2 - 10}px`, // Adjust to align the circle properly
        border: "2px solid white", // Add border to improve visibility if needed
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
          border-radius: 5px;
          cursor: pointer;
        }

        input[type='range']:focus {
          outline: none;
        }

        input[type='range']::-webkit-slider-runnable-track {
          width: 100%;
          height: ${height};
          background: transparent;
          border-radius: 5px;
          cursor: pointer;
        }

        input[type='range']::-moz-range-track {
          width: 100%;
          height: ${height};
          background: transparent;
          border-radius: 5px;
          cursor: pointer;
        }

        input[type='range']::-webkit-slider-thumb {
          ${Object.entries(thumbStyle)
            .map(([key, value]) => `${key}: ${value};`)
            .join(" ")}
          margin-top: 0px; /* Offset for the thumb */
        }

        input[type='range']::-moz-range-thumb {
          ${Object.entries(thumbStyle)
            .map(([key, value]) => `${key}: ${value};`)
            .join(" ")}
        }
      `;
      document.head.appendChild(styleElement);

      return () => {
        document.head.removeChild(styleElement);
      };
    }
  }, [thumbColor, trackColor, height, fillColor, value, min, max]);

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
    <div style={{ ...styles.sliderContainer, width, ...containerStyle }}>
      <input
        type="range"
        style={{ ...styles.slider, height }}
        min={min}
        max={max}
        value={tempValue}
        onChange={handleChange}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleMouseUp}
      />
      <div style={styles.sliderValue}>{tempValue}</div>
    </div>
  );
};

const styles = {
  sliderContainer: {
    display: "flex",
    alignItems: "center",
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
  sliderValue: {
    marginLeft: "10px",
    fontSize: "1.2em",
    color: "#000", // Changed to black for better readability
  },
};

export default SliderComponent;

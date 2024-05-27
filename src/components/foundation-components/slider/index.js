import React, { useState, useEffect } from "react";

const SliderComponent = ({
  min = 0,
  max = 100,
  width = "100%",
  height = "10px",
  containerStyle = {},
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
    const thumbStyle = {
      WebkitAppearance: "none",
      appearance: "none",
      width: "25px",
      height: "25px",
      background: "#eb631c",
      cursor: "pointer",
      borderRadius: "50%",
    };

    const sliderStyle = document.createElement("style");
    sliderStyle.innerHTML = `
      input[type='range']::-webkit-slider-thumb {
        ${Object.entries(thumbStyle)
          .map(([key, value]) => `${key}: ${value};`)
          .join(" ")}
      }

      input[type='range']::-moz-range-thumb {
        ${Object.entries(thumbStyle)
          .map(([key, value]) => `${key}: ${value};`)
          .join(" ")}
      }
    `;
    document.head.appendChild(sliderStyle);

    return () => {
      document.head.removeChild(sliderStyle);
    };
  }, []);

  return (
    <div style={{ ...styles.sliderContainer, ...containerStyle }}>
      <input
        type="range"
        style={{ ...styles.slider, width, height }}
        min={min}
        max={max}
        value={tempValue}
        onChange={handleChange}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleMouseUp}
      />
      <div style={styles.sliderValue}>{value}</div>
    </div>
  );
};

const styles = {
  sliderContainer: {
    display: "flex",
    alignItems: "center",
    width: "100%", // default to 100%, can be overridden by containerStyle
  },
  slider: {
    WebkitAppearance: "none",
    appearance: "none",
    background: "#ddd",
    outline: "none",
    opacity: "0.7",
    transition: "opacity .2s",
  },
  sliderValue: {
    marginLeft: "10px",
    fontSize: "1.2em",
  },
};

export default SliderComponent;

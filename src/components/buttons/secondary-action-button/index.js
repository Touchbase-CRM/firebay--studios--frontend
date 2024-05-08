import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";

export const SecondaryActionButton = ({
  width = "100px",
  height = "40px",
  initialText = "State 1",
  clickedText = "State 2",
  duration = 1000,
  onClick,
  disabled = false,
  opacity = "1",
  marginRight = "0px",
  marginTop = "0px",
  ...rest
}) => {
  const [buttonText, setButtonText] = useState(initialText);
  const [clicked, setClicked] = useState(false);

  const handleClick = (event) => {
    if (onClick) {
      onClick(event);
    }
    setClicked(true);
  };

  useEffect(() => {
    let timer;
    if (clicked) {
      setButtonText(clickedText);
      timer = setTimeout(() => {
        setButtonText(initialText);
        setClicked(false);
      }, duration);
    }
    return () => clearTimeout(timer);
  }, [clicked, initialText, clickedText, duration]);

  const buttonStyle = {
    width,
    height,
    backgroundColor: "white",
    border: `1px solid #FDA942`,
    color: "black",
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    opacity,
    marginRight,
    marginTop,
  };

  return (
    <Button
      style={buttonStyle}
      onClick={handleClick}
      disabled={disabled}
      {...rest}
    >
      <span
        style={{ verticalAlign: "middle", marginLeft: "8px", color: "black" }}
      >
        {buttonText}
      </span>
    </Button>
  );
};

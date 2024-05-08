// SecondaryActionButton.js
import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";

export const SecondaryActionButton = ({
  width = "50px",
  height = "50px",
  initialText = "State 1",
  clickedText = "State 2",
  duration = 1000,
  onClick,
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
    border: `1px solid #FDA942`, // Updated border property
    color: "black",
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
  };

  return (
    <Button style={buttonStyle} onClick={handleClick} {...rest}>
      {buttonText}
    </Button>
  );
};

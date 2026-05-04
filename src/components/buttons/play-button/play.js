import React, { useState } from "react";

export const PlayButton = ({
  onClickHandler,
  handlerArgs = [],
  size = "24px",
  preventDefault = false, // Default is false, so it only activates if explicitly set to true
  stopPropagation = false, // Same as above,
  isDisabled = false,
}) => {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = (e) => {
    if (stopPropagation) e.stopPropagation();
    if (preventDefault) e.preventDefault();
    setIsClicked(true);
    onClickHandler(...handlerArgs);
    setTimeout(() => {
      setIsClicked(false);
    }, 200); // Reset state back after 200 ms
  };

  return (
    <button
      onClick={handleClick}
      style={{
        backgroundColor: "transparent",
        borderColor: "transparent",
        color: isClicked ? "var(--accent-500)" : "currentColor",
        padding: "0",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      className="btn"
      disabled={isDisabled}
    >
      <i
        className={isClicked ? "bi bi-play-circle-fill" : "bi bi-play-circle"}
        style={{
          color: "var(--accent-500)",
          fontSize: size,
        }}
      ></i>
    </button>
  );
};

import React, { useState } from "react";

export const PlayButton = ({
  onClickHandler,
  handlerArgs = [],
  size = "24px",
  preventDefault = false, // Default is false, so it only activates if explicitly set to true
  stopPropagation = false, // Same as above
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
        color: isClicked ? "#eb631c" : "currentColor",
        padding: "0",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      className="btn"
    >
      <i
        className={isClicked ? "bi bi-play-circle-fill" : "bi bi-play-circle"}
        style={{
          color: "#eb631c",
          fontSize: size,
        }}
      ></i>
    </button>
  );
};

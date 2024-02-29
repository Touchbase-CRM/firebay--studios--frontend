import React, { useState } from "react";

export const PlayButton = ({
  onClickHandler,
  handlerArgs = [],
  size = "24px",
}) => {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
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
        display: "inline-flex", // Ensure the button respects the size of its content
        alignItems: "center", // Center the icon vertically
        justifyContent: "center", // Center the icon horizontally
      }}
      className="btn"
    >
      <i
        className={isClicked ? "bi bi-play-circle-fill" : "bi bi-play-circle"}
        style={{
          color: "#eb631c",
          fontSize: size, // Control the size of the icon with the `size` prop
        }}
      ></i>
    </button>
  );
};

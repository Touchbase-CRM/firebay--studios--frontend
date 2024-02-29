import React, { useState } from "react";

export const PlayButton = ({ onClickHandler, handlerArgs = [] }) => {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    setIsClicked(true);
    // Call the onClickHandler with all provided arguments
    onClickHandler(...handlerArgs);
    setTimeout(() => {
      setIsClicked(false);
    }, 200); // Reset state back after 200 ms
  };

  return (
    <button
      onClick={handleClick}
      style={{
        backgroundColor: "transparent", // Always transparent
        borderColor: "transparent", // Transparent border to not show it, since icon color is used for visual effect
        color: isClicked ? "#eb631c" : "currentColor", // Change icon color to orange when clicked
        padding: 0, // Remove padding to make it look more like just the icon is clickable
      }}
      className="btn" // Apply Bootstrap button styling
    >
      <i
        className={isClicked ? "bi bi-play-circle-fill" : "bi bi-play-circle"}
        style={{ color: "#eb631c" }}
      ></i>
    </button>
  );
};

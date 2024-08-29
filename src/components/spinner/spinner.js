import React, { useEffect } from "react";

const Spinner = ({ top, bottom, left, right }) => {
  const spinnerStyle = {
    position: "absolute",
    top: top !== undefined ? top : "50%",
    bottom: bottom !== undefined ? bottom : undefined,
    left: left !== undefined ? left : "50%",
    right: right !== undefined ? right : undefined,
    transform:
      top !== undefined || bottom !== undefined
        ? left !== undefined || right !== undefined
          ? ""
          : "translateY(-50%)"
        : left !== undefined || right !== undefined
          ? "translateX(-50%)"
          : "translate(-50%, -50%)",
    border: "16px solid #f3f3f3",
    borderTop: "16px solid darkorange",
    borderRadius: "50%",
    width: "120px",
    height: "120px",
    animation: "spin 2s linear infinite",
  };

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return <div style={spinnerStyle}></div>;
};

export default Spinner;

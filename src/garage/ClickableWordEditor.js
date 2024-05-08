import React, { useState } from "react";
import { Card } from "react-bootstrap";

const ClickableWordEditor = ({ script, onTransformedscriptChange }) => {
  const [transformedWords, setTransformedWords] = useState({});
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedWordIndex, setSelectedWordIndex] = useState(null);

  const handleLeftClick = (event, index) => {
    event.preventDefault();
    setShowMenu(!showMenu);
    setMenuPosition({ x: event.clientX, y: event.clientY });
    setSelectedWordIndex(index);
  };

  const transformWord = (action) => {
    let currentWord =
      transformedWords[selectedWordIndex] || script[selectedWordIndex];

    switch (action) {
      case "upper":
        transformedWords[selectedWordIndex] = currentWord.toUpperCase();
        break;
      case "lower":
        transformedWords[selectedWordIndex] = currentWord.toLowerCase();
        break;
      case "emphasize":
        transformedWords[selectedWordIndex] =
          currentWord.startsWith("'") && currentWord.endsWith("'")
            ? currentWord.slice(1, -1)
            : `'${currentWord}'`;
        break;
      case "reset":
        delete transformedWords[selectedWordIndex];
        break;
      default:
        break;
    }

    setTransformedWords({ ...transformedWords });
    updateParentWithNewscript();
    setShowMenu(false);
  };

  const updateParentWithNewscript = () => {
    const newscript = script
      .map((word, index) => transformedWords[index] || word)
      .join(" ");
    onTransformedscriptChange(newscript);
  };

  return (
    <Card style={{ backgroundColor: "black", color: "white" }}>
      <Card.Body>
        <Card.Title>
          Emphasize your keywords by clicking the words below
        </Card.Title>
        <div>
          {script.map((word, index) => (
            <span
              key={index}
              onClick={(e) => handleLeftClick(e, index)}
              style={{
                marginRight: "5px",
                cursor: "pointer",
                textDecoration: "underline",
                textDecorationColor: "transparent",
                color: "orange",
              }}
              onMouseEnter={(e) =>
                (e.target.style.textDecorationColor = "orange")
              }
              onMouseLeave={(e) =>
                (e.target.style.textDecorationColor = "transparent")
              }
            >
              {transformedWords[index] || word}
            </span>
          ))}
        </div>
        {showMenu && (
          <div
            style={{
              position: "absolute",
              top: menuPosition.y,
              left: menuPosition.x,
              zIndex: 1000,
              backgroundColor: "#f8f9fa",
              boxShadow: "0px 8px 16px 0px rgba(0,0,0,0.2)",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              padding: "8px 12px",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <h6
              style={{
                marginBottom: "10px",
                color: "#333",
                fontWeight: "500",
                fontSize: "13px",
              }}
            >
              Word Smith
            </h6>
            <button
              className="btn btn-light"
              onClick={() => transformWord("upper")}
              style={{ marginBottom: "8px", fontSize: "12px" }}
            >
              Upper Case
            </button>
            <button
              className="btn btn-light"
              onClick={() => transformWord("lower")}
              style={{ marginBottom: "8px", fontSize: "12px" }}
            >
              Lower Case
            </button>
            <button
              className="btn btn-light"
              onClick={() => transformWord("emphasize")}
              style={{ marginBottom: "8px", fontSize: "12px" }}
            >
              Emphasize
            </button>
            <button
              className="btn btn-light"
              style={{ marginBottom: "8px", fontSize: "12px" }}
              onClick={() => transformWord("reset")}
            >
              Reset Word
            </button>
            <button
              className="btn btn-light"
              onClick={() => setShowMenu(false)}
              style={{ fontSize: "12px" }}
            >
              Close
            </button>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ClickableWordEditor;

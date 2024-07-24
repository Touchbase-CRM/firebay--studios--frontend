import React from "react";
import { Offcanvas, Button, Form } from "react-bootstrap";

const WordSmithOffcanvas = ({
    offcanvasVisible,
    hideOffcanvas,
    showOptions,
    ogScriptWordsArray,
    selectedWordIndex,
    handleWordClick,
    setShowOptions,
    transformWord,
    typedText,
    transformedWords
}) => {
    const emphasisButtonStyles = {
        emphasizeLevel1: {
            borderColor: "#90ee90", // Light green
            color: "#EB631C",
        },
        emphasizeLevel2: {
            borderColor: "#FFD700", // Yellow
            color: "#EB631C",
        },
        emphasizeLevel3: {
            borderColor: "#FF4500", // Red
            color: "#EB631C",
        },
        removeEmphasis: {
            borderColor: "#EB631C", // Default
            color: "#EB631C",
        }
    };

    return (
        <Offcanvas
            show={offcanvasVisible}
            onHide={hideOffcanvas}
            placement="bottom"
            style={{ width: "100%", height: "50%", minHeight: "30%", backgroundColor: "#f8f9fa", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", borderRadius: "15px 15px 0 0" }}
        >
            <Offcanvas.Header closeButton style={{ backgroundColor: "#f8f9fa", borderBottom: "1px solid #eb631c", borderRadius: "15px 15px 0 0" }}>
                <Offcanvas.Title style={{ fontSize: "1.25rem", display: "block", textAlign: "left", fontFamily: "'Times New Roman', Times, serif", color: "#4a4a4a" }}>
                    {showOptions
                        ? <>Select an option to emphasize the chosen word: <span style={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: "bold", color: "#EB631C", fontSize: "1.5rem", fontStyle: "italic" }}>{ogScriptWordsArray[selectedWordIndex]}</span></>
                        : "Change Emphasis"}
                </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body style={{ overflowY: "auto", padding: "20px", backgroundColor: "#f8f9fa" }}>
                {!showOptions ? (
                    <>
                        <Form.Label style={{ fontSize: "1rem", color: "#4a4a4a", fontFamily: "'Times New Roman', Times, serif" }}>
                            Click on a word to change its emphasis
                        </Form.Label>
                        <div
                            className="bg-light p-3 rounded mt-3"
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "10px",
                                backgroundColor: "#ffffff",
                                boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
                            }}
                        >
                            {typedText.split(" ").map((word, index) => {
                                let borderColor = emphasisButtonStyles.removeEmphasis.borderColor; // Default color
                                const transformedWord = transformedWords[index];
                                if (transformedWord && transformedWord !== ogScriptWordsArray[index]) {
                                    if (transformedWord.toUpperCase() === word.toUpperCase() && !transformedWord.startsWith("'") && !transformedWord.endsWith("'")) {
                                        borderColor = emphasisButtonStyles.emphasizeLevel1.borderColor;
                                    } else if (transformedWord.startsWith("'") && transformedWord.endsWith("'") && transformedWord !== `'${word.toUpperCase()}'`) {
                                        borderColor = emphasisButtonStyles.emphasizeLevel2.borderColor;
                                    } else if (transformedWord === `'${word.toUpperCase()}'`) {
                                        borderColor = emphasisButtonStyles.emphasizeLevel3.borderColor;
                                    }
                                }

                                return (
                                    <span
                                        key={index}
                                        style={{
                                            cursor: "pointer",
                                            color: "#EB631C", // Orange brand color
                                            backgroundColor: "#f8f9fa", // Light background color
                                            padding: "8px 12px",
                                            borderRadius: "15px",
                                            fontSize: "1.1rem", // Slightly larger font size
                                            fontWeight: "500", // Medium font weight
                                            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                                            transition: "all 0.3s ease",
                                            border: `2px solid ${borderColor}`
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = "#ffecd1";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = "#f8f9fa";
                                        }}
                                        onClick={() => {
                                            handleWordClick(index);
                                            setShowOptions(true); // Show the options when a word is clicked
                                        }}
                                    >
                                        {transformedWords[index] || word}
                                    </span>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="mt-4" style={{ textAlign: "center" }}>
                        <Button variant="outline-dark" className="me-2" style={{ ...emphasisButtonStyles.emphasizeLevel3, borderRadius: "20px", fontWeight: "bold" }} onClick={() => { transformWord("emphasizeLevel3"); setShowOptions(false); }}>High Emphasis</Button>
                        <Button variant="outline-dark" className="me-2" style={{ ...emphasisButtonStyles.emphasizeLevel2, borderRadius: "20px", fontWeight: "bold" }} onClick={() => { transformWord("emphasizeLevel2"); setShowOptions(false); }}>Medium Emphasis</Button>
                        <Button variant="outline-dark" className="me-2" style={{ ...emphasisButtonStyles.emphasizeLevel1, borderRadius: "20px", fontWeight: "bold" }} onClick={() => { transformWord("emphasizeLevel1"); setShowOptions(false); }}>Low Emphasis</Button>
                        <Button variant="outline-dark" className="me-2" style={{ ...emphasisButtonStyles.removeEmphasis, borderRadius: "20px", fontWeight: "bold", borderColor: "#EB631C" }} onClick={() => { transformWord("removeEmphasis"); setShowOptions(false); }}>Remove Emphasis</Button>
                        <Button variant="outline-dark" className="me-2" style={{ color: "#EB631C", borderRadius: "20px", fontWeight: "bold", borderColor: "#EB631C" }} onClick={() => setShowOptions(false)}>Cancel</Button>
                    </div>
                )}
            </Offcanvas.Body>
        </Offcanvas>
    );
};

export default WordSmithOffcanvas;

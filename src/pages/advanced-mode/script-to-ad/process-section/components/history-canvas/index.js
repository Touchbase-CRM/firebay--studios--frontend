import React from "react";
import { Button, Offcanvas, Accordion } from "react-bootstrap";
import CodeBlock from "./code-block";

const HistoryCanvas = ({
  show,
  handleClose,
  localSectionHistoryObj,
  playAudioUrl,
  changeCurrentSectionObj,
}) => {
  // Guard clause to handle null or undefined localSectionHistoryObj
  if (!localSectionHistoryObj) {
    // Optionally, you can render a placeholder or a message indicating no history is available
    return (
      <Offcanvas
        show={show}
        onHide={handleClose}
        placement="end"
        style={{ width: "800px" }}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Read History</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <p>No history available.</p>
        </Offcanvas.Body>
      </Offcanvas>
    );
  }

  return (
    <Offcanvas
      show={show}
      onHide={handleClose}
      placement="end"
      style={{ width: "800px" }}
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>Read History</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body style={{ overflowY: "auto", maxHeight: "80vh" }}>
        <Accordion defaultActiveKey="0">
          {Array.from(localSectionHistoryObj.entries()).map(
            ([key, value], mapIndex) => (
              <Accordion.Item eventKey={String(mapIndex)} key={key}>
                <Accordion.Header>{`Read ${mapIndex + 1}`}</Accordion.Header>
                <Accordion.Body>
                  <div
                    style={{
                      marginBottom: "20px",
                      padding: "20px",
                      backgroundColor: "#f8f9fa",
                      borderRadius: "5px",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "18px",
                        lineHeight: "1.6",
                        color: "#495057",
                        textAlign: "justify",
                        margin: 0,
                      }}
                    >
                      <CodeBlock
                        code={value.getCurrentWords().join(" ")}
                        title={`${value.getVoiceName()} says`}
                      />
                    </div>
                  </div>
                  <div className="d-grid gap-2">
                    <Button
                      size="lg"
                      style={{
                        marginBottom: "10px",
                        backgroundColor: "#eb631c",
                        borderColor: "#eb631c",
                        color: "white",
                      }}
                      onClick={() => playAudioUrl(value.getGeneratedVoiceUrl())}
                    >
                      Play
                    </Button>
                    <Button
                      size="lg"
                      style={{
                        backgroundColor: "white",
                        borderColor: "#FDA942",
                        color: "black",
                      }}
                      onClick={() => changeCurrentSectionObj(value)}
                    >
                      Use Read
                    </Button>
                  </div>
                </Accordion.Body>
              </Accordion.Item>
            )
          )}
        </Accordion>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default HistoryCanvas;

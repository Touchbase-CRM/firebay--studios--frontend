import React from "react";
import { Button, Offcanvas, Accordion } from "react-bootstrap";
import { CodeBlock } from "./codeBlock";

export const HistoryCanvas = ({
  show,
  handleClose,
  reads,
  localSectionHistoryObj = [],
}) => {
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
        {" "}
        {console.log("localSectionHistoryObj", localSectionHistoryObj)}
        {/* Adjust maxHeight according to your needs */}
        <Accordion defaultActiveKey="0">
          {reads.map((read, index) => (
            <Accordion.Item eventKey={String(index)} key={index}>
              <Accordion.Header>{read.title}</Accordion.Header>
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
                    <CodeBlock code={read.content} title="Charley says" />
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
                  >
                    Use Read
                  </Button>
                </div>
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

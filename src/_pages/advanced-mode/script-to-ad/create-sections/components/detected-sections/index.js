// _pages/advanced-mode/script-to-ad/create-sections/components/detected-sections/index.js

import React from "react";
import { Offcanvas, ListGroup } from "react-bootstrap";

const DetectedSections = ({ show, handleClose, sections }) => {
  return (
    <Offcanvas
      show={show}
      onHide={handleClose}
      placement="end"
      style={{ width: "auto", maxWidth: "90vw", backgroundColor: "#f8f9fa" }}
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>Detected Sections</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        {sections.length > 0 ? (
          <ListGroup>
            {sections.map((section, index) => (
              <ListGroup.Item
                key={index}
                className="mb-3"
                style={{
                  border: "1px solid #eb631c",
                  borderRadius: "5px",
                  padding: "15px",
                  backgroundColor: "white",
                  fontFamily: "'Garamond', serif",
                  fontSize: "16px",
                  lineHeight: "1.6",
                  color: "#333",
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    color: "#eb631c",
                    fontSize: "18px",
                  }}
                >
                  Section {section.getIndex() + 1}
                </div>
                <div
                  style={{
                    marginTop: "10px",
                    fontStyle: "italic",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {section.getOriginalContent()}
                </div>
                <div
                  style={{
                    marginTop: "10px",
                    textAlign: "right",
                    fontSize: "12px",
                    color: "#666",
                  }}
                >
                  Character count: {section.getOriginalCharCount()}
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : (
          <p style={{ color: "gray", fontStyle: "italic" }}>
            No sections found
          </p>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default DetectedSections;

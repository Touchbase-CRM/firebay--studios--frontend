import React from "react";
import { Modal, Button } from "react-bootstrap";
import Link from "next/link";

export const ActionSelectorModal = ({ show, onHide, title, buttonOptions }) => {
  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      style={{
        maxWidth: "1000px",
        width: "95%",
        height: "900px",
        fontFamily: '"Segoe UI", Helvetica, Arial, sans-serif',
        backgroundColor: "#f8f9fa",
        color: "#343a40",
        borderRadius: "12px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        overflow: "hidden",
      }}
    >
      <Modal.Header
        closeButton
        style={{
          borderBottom: "1px solid #dee2e6",
          padding: "20px 30px",
          backgroundColor: "#e4e4e4",
        }}
      >
        <Modal.Title
          style={{ fontWeight: "600", fontSize: "28px", color: "#495057" }}
        >
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-grid gap-2" style={{ width: "100%" }}>
          {buttonOptions.map((button, index) =>
            button.href ? (
              <Link href={button.href} passHref key={index}>
                <Button
                  variant={button.variant}
                  size="lg"
                  onClick={() => {
                    onHide();
                    button.handler();
                  }}
                  style={{
                    marginBottom: "10px",
                    backgroundColor: button.backgroundColor,
                    borderColor: button.borderColor,
                    color: button.textColor,
                    width: "100%",
                    fontSize: "20px",
                    fontWeight: "600",
                    padding: "15px 30px",
                  }}
                >
                  {button.text}
                </Button>
              </Link>
            ) : (
              <Button
                variant={button.variant}
                size="lg"
                onClick={() => {
                  onHide();
                  button.handler();
                }}
                style={{
                  marginBottom: "10px",
                  backgroundColor: button.backgroundColor,
                  borderColor: button.borderColor,
                  color: button.textColor,
                  width: "100%",
                  fontSize: "20px",
                  fontWeight: "600",
                  padding: "15px 30px",
                }}
                key={index}
              >
                {button.text}
              </Button>
            )
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
};

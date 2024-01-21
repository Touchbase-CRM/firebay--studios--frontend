import React from "react";
import { Row, Col, Card, Form, Navbar, Nav, Button } from "react-bootstrap";

const GenericPage = () => {
  return (
    <div
      style={{
        backgroundColor: "#343a40",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Navbar */}
      <Navbar
        bg="dark"
        variant="dark"
        expand="lg"
        style={{ marginBottom: "20px" }}
      >
        <Navbar.Brand style={{ marginLeft: "10px" }}>
          {/* Your Logo Here */}
        </Navbar.Brand>
        {/* Navbar contents */}
      </Navbar>

      {/* Main Content */}
      <Row>
        <Col md={10} className="mx-auto">
          {/* Card Component */}
          <Card
            style={{
              padding: "20px",
              backgroundColor: "#282c34",
              color: "white",
              marginTop: "10px",
              marginBottom: "10px",
            }}
          >
            <Card.Title>Page Title</Card.Title>

            {/* Your Page Content Here */}
            {/* Example Form Element */}
            <Form.Control
              style={{
                color: "black",
                backgroundColor: "white",
                marginBottom: "20px",
              }}
              type="text"
              placeholder="Example Input"
            />

            {/* Example Button */}
            <Button
              style={{
                backgroundColor: "#282c34",
                color: "white",
                border: "none",
              }}
            >
              Click Me
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default GenericPage;

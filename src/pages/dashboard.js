// dashboard.js
import { Button, Table, Container, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const Dashboard = () => {
  const handlePlayClick = () => {
    console.log("Play button clicked");
  };

  const handleDeleteClick = () => {
    console.log("Delete button clicked");
  };

  const tableHeaderStyle = {
    backgroundColor: "#e4e4e4",
  };

  const pageStyles = {
    backgroundColor: "white", // Ensures the page background is white
    padding: "20px 0", // Adds padding to the top and bottom
    minHeight: "100vh", // Full view height
  };

  const buttonContainerStyles = {
    display: "flex",
    justifyContent: "flex-end",
    paddingBottom: "1rem", // Adds space between button and table
  };

  // Ensure that the global styles do not interfere
  const globalReset = {
    margin: 0, // Resets any margin that may cause the black stripe
    padding: 0, // Resets any padding that may cause the black stripe
  };

  return (
    <Container fluid style={pageStyles}>
      <Row style={globalReset}>
        <Col xs={12} md={6}>
          <h1>Your ads</h1>
        </Col>
        <Col xs={12} md={6} style={buttonContainerStyles}>
          <Button
            variant="warning"
            style={{
              backgroundColor: "#eb631c",
              borderColor: "#eb631c",
              color: "white",
            }}
          >
            Create a new ad
          </Button>
        </Col>
      </Row>

      <Table striped bordered hover>
        <thead style={tableHeaderStyle}>
          <tr>
            <th>Ad Name</th>
            <th>Voice</th>
            <th>Music</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }).map((_, index) => (
            <tr key={index}>
              <td>Lorem ipsum dolor sit amet, consecte...</td>
              <td>Charley</td>
              <td>Upbeat</td>
              <td>Nov 3, 2023, 10:32AM</td>
              <td>
                <Button variant="link" onClick={handlePlayClick}>
                  <i className="bi bi-play-fill" style={{ color: "black" }}></i>
                </Button>
                <Button variant="link" onClick={handleDeleteClick}>
                  <i className="bi bi-trash-fill" style={{ color: "red" }}></i>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Row className="justify-content-center" style={{ paddingTop: "20px" }}>
        <Col className="text-center">
          <Button variant="outline-secondary" disabled>
            {"<"}
          </Button>{" "}
          <Button variant="outline-secondary" disabled>
            {">"}
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;

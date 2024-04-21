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
    padding: "20px", // Adds padding around the content
    minHeight: "100vh", // Full view height
  };

  const tableStyles = {
    marginLeft: "auto", // Aligns the table to the right edge of the parent container
    marginRight: "auto", // Keeps space from the right edge of the viewport
    maxWidth: "calc(100% - 40px)", // Ensures some space between the table and the viewport edges
  };

  return (
    <Container fluid style={pageStyles}>
      <Row className="align-items-center mb-4">
        <Col xs={12} md={8}>
          <h1>Your ads</h1>
        </Col>
        <Col xs={12} md={4} className="text-md-right">
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

      <Row>
        <Col style={{ paddingLeft: "0", paddingRight: "0" }}>
          <Table striped bordered hover style={tableStyles}>
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
                      <i
                        className="bi bi-play-fill"
                        style={{ color: "black" }}
                      ></i>
                    </Button>
                    <Button variant="link" onClick={handleDeleteClick}>
                      <i
                        className="bi bi-trash-fill"
                        style={{ color: "red" }}
                      ></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>

      <Row className="justify-content-center pt-4">
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

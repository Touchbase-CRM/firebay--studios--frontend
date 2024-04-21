// relative path: src/pages/dashboard.js
import { Button, Table, Container, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const Dashboard = () => {
  const handlePlayClick = () => {
    console.log("Play button clicked");
  };

  const handleDeleteClick = () => {
    console.log("Delete button clicked");
  };

  return (
    <Container
      fluid
      style={{
        backgroundColor: "white",
        padding: "20px",
        minHeight: "100vh",
      }}
    >
      <Row
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "1rem",
        }}
      >
        <Col xs={12}>
          <Button
            variant="warning"
            style={{
              backgroundColor: "#eb631c",
              borderColor: "#eb631c",
              color: "white",
              alignSelf: "flex-start", // Aligns button to the right within the column
            }}
          >
            Create a new ad
          </Button>
        </Col>
      </Row>

      <Row>
        <Col xs={12}>
          <Table striped bordered hover>
            <thead
              style={{
                backgroundColor: "#e4e4e4",
              }}
            >
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

      <Row>
        <Col xs={12} className="text-right">
          <div style={{ marginTop: "20px" }}>
            {" "}
            {/* Adds space between table and navigation */}
            <Button variant="outline-secondary" disabled>
              {"<"}
            </Button>{" "}
            <Button variant="outline-secondary" disabled>
              {">"}
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;

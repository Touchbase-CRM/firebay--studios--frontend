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

  // Adjusted styles for the page elements
  const headerStyles = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px", // Added space between header and table
    paddingTop: "20px", // Just for some breathing room at the top
    backgroundColor: "white", // Ensuring the background is white
  };

  const tableHeaderStyle = {
    backgroundColor: "#e4e4e4",
  };

  return (
    <Container fluid style={{ backgroundColor: "white" }}>
      <div style={headerStyles}>
        <h1>Your ads</h1>
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
      </div>

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

      <div className="pagination-container" style={{ paddingBottom: "20px" }}>
        <Button variant="outline-secondary" disabled>
          {"<"}
        </Button>{" "}
        <Button variant="outline-secondary" disabled>
          {">"}
        </Button>
      </div>
    </Container>
  );
};

export default Dashboard;

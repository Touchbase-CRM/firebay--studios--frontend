import { Button, Table, Container, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const Dashboard = () => {
  const handleDownloadClick = () => {
    console.log("Download button clicked");
  };

  const handleDeleteClick = () => {
    console.log("Delete button clicked");
  };

  const handleCopyClick = () => {
    console.log("Copy action initiated");
  };

  const handleEditClick = () => {
    console.log("Edit action initiated");
  };

  const handleRenameClick = () => {
    console.log("Rename action initiated");
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
              alignSelf: "flex-start",
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
                <th>Type</th>
                <th>Created</th>
                <th>Last Downloaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, index) => (
                <tr key={index}>
                  <td>Lorem ipsum dolor sit amet, consecte...</td>
                  <td>S2A Quick</td>
                  <td>Nov 3, 2023, 11:32AM</td>
                  <td>Nov 5, 2023, 10:32AM</td>
                  <td>
                    <Button
                      variant="link"
                      onClick={handleDownloadClick}
                      title="Download Ad"
                    >
                      <i
                        className="bi bi-download"
                        style={{ color: "black" }}
                      ></i>
                    </Button>
                    <Button
                      variant="link"
                      onClick={handleCopyClick}
                      title="Duplicate Ad"
                    >
                      <i className="bi bi-files" style={{ color: "black" }}></i>
                    </Button>
                    <Button
                      variant="link"
                      onClick={handleRenameClick}
                      title="Rename Ad"
                    >
                      <i
                        className="bi bi-input-cursor-text"
                        style={{ color: "black" }}
                      ></i>
                    </Button>
                    <Button
                      variant="link"
                      onClick={handleEditClick}
                      title="Edit Ad"
                    >
                      <i
                        className="bi bi-pencil-square"
                        style={{ color: "black" }}
                      ></i>
                    </Button>
                    <Button
                      variant="link"
                      onClick={handleDeleteClick}
                      title="Delete Ad"
                    >
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

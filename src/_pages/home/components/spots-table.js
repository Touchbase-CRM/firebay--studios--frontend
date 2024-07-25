import React from "react";
import { Table, Button, Row, Col, Alert } from "react-bootstrap";

const SpotTable = ({
  spots,
  handleSpotActions,
  currentTableIndex,
  setCurrentTableIndex,
  pageSize,
  totalSpots,
  totalDownloads,
}) => {
  const handleNextPage = () => {
    if (currentTableIndex + pageSize < totalSpots) {
      setCurrentTableIndex(currentTableIndex + pageSize);
    }
  };

  const handlePreviousPage = () => {
    if (currentTableIndex - pageSize >= 0) {
      setCurrentTableIndex(currentTableIndex - pageSize);
    }
  };

  return (
    <div style={{ padding: 0, margin: 0, minWidth: "800px" }}>
      {spots.length === 0 ? (
        <Alert variant="info" className="text-center">
          Welcome to Pyro! Click on the "Create a new Spot" button above to get started!
        </Alert>
      ) : (
        <Table striped bordered hover style={{ padding: 0, margin: 0 }}>
          <thead style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #dee2e6" }}>
            <tr>
              <th
                style={{
                  width: "150px",
                  padding: "0.75rem",
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#343a40",
                  fontFamily: "'Merriweather', serif",
                  textShadow: "1px 1px 2px #ccc",
                }}
              >
                Spot Name
              </th>
              <th
                style={{
                  width: "150px",
                  whiteSpace: "nowrap",
                  padding: "0.75rem",
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#343a40",
                  fontFamily: "'Merriweather', serif",
                  textShadow: "1px 1px 2px #ccc",
                }}
              >
                Created
              </th>
              <th
                style={{
                  width: "200px",
                  padding: "0.75rem",
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#343a40",
                  fontFamily: "'Merriweather', serif",
                  textShadow: "1px 1px 2px #ccc",
                }}
              >
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {spots.map((spot, index) => (
              <tr key={index} style={{ fontSize: "18px", fontWeight: "500", color: "#495057", fontFamily: "'Open Sans', sans-serif" }}>
                <td style={{ padding: "0.75rem", borderBottom: "1px solid #dee2e6" }}>{spot.spotName || "-"}</td>
                <td style={{ width: "250px", whiteSpace: "nowrap", padding: "0.75rem", borderBottom: "1px solid #dee2e6" }}>{spot.created || "-"}</td>
                <td style={{ padding: "0.75rem", borderBottom: "1px solid #dee2e6" }}>
                  <Button
                    variant="link"
                    onClick={() => handleSpotActions.downloadHistory(spot.id)}
                    title="Download Logs"
                    disabled={spot.downloadLogs.length === 0}
                    style={{ padding: "0.25rem", margin: "0 0.25rem" }}
                  >
                    <i
                      className="bi bi-clock-history"
                      style={{
                        color: spot.downloadLogs.length > 0 ? "#000000" : "#6c757d",
                      }}
                    ></i>
                  </Button>

                  <Button
                    variant="link"
                    onClick={() => handleSpotActions.copy(spot.id)}
                    title="Duplicate Spot"
                    style={{ padding: "0.25rem", margin: "0 0.25rem" }}
                  >
                    <i className="bi bi-files" style={{ color: "#000000" }}></i>
                  </Button>
                  <Button
                    variant="link"
                    onClick={() => handleSpotActions.rename(spot.id)}
                    title="Rename Spot"
                    style={{ padding: "0.25rem", margin: "0 0.25rem" }}
                  >
                    <i className="bi bi-input-cursor-text" style={{ color: "#000000" }}></i>
                  </Button>
                  <Button
                    variant="link"
                    onClick={() => handleSpotActions.edit(spot.id)}
                    title="Edit Spot"
                    style={{ padding: "0.25rem", margin: "0 0.25rem" }}
                  >
                    <i className="bi bi-pencil-square" style={{ color: "#000000" }}></i>
                  </Button>
                  <Button
                    variant="link"
                    onClick={() => handleSpotActions.delete(spot.id)}
                    title="Delete Spot"
                    style={{ padding: "0.25rem", margin: "0 0.25rem" }}
                  >
                    <i className="bi bi-trash-fill" style={{ color: "red" }}></i>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Row className="align-items-center mt-3">
        <Col xs="auto">
          <Button
            variant="outline-secondary"
            onClick={handlePreviousPage}
            disabled={currentTableIndex === 0}
          >
            {"<"}
          </Button>{" "}
          <Button
            variant="outline-secondary"
            onClick={handleNextPage}
            disabled={currentTableIndex + pageSize >= totalSpots}
          >
            {">"}
          </Button>
        </Col>
        <Col className="text-right">
          {totalDownloads !== null && totalDownloads > 0 && (
            <p
              style={{
                fontWeight: "bold",
                textAlign: "right",
                marginRight: "0px",
                fontSize: "18px",
                color: "#495057",
                fontFamily: "'Open Sans', sans-serif",
              }}
            >
              Total chargeable downloads this month: {totalDownloads}
            </p>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default SpotTable;

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
    <div>
      {spots.length === 0 ? (
        <Alert variant="info" className="text-center">
          Welcome to Pyro! Click on the "Create a new Spot" button above to get started!
        </Alert>
      ) : (
        <Table striped bordered hover>
          <thead
            style={{
              backgroundColor: "#e4e4e4",
            }}
          >
            <tr>
              <th style={{ width: "200px" }}>Spot Name</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {spots.map((spot, index) => (
              <tr key={index}>
                <td>{spot.spotName || "-"}</td>
                <td>{spot.created || "-"}</td>
                <td>
                  <Button
                    variant="link"
                    onClick={() => handleSpotActions.downloadHistory(spot.id)}
                    title="Download Logs"
                    disabled={spot.downloadLogs.length === 0}
                  >
                    <i
                      className="bi bi-clock-history"
                      style={{
                        color: spot.downloadLogs.length > 0 ? "black" : "gray",
                      }}
                    ></i>
                  </Button>

                  <Button
                    variant="link"
                    onClick={() => handleSpotActions.copy(spot.id)}
                    title="Duplicate Spot"
                  >
                    <i className="bi bi-files" style={{ color: "black" }}></i>
                  </Button>
                  <Button
                    variant="link"
                    onClick={() => handleSpotActions.rename(spot.id)}
                    title="Rename Spot"
                  >
                    <i
                      className="bi bi-input-cursor-text"
                      style={{ color: "black" }}
                    ></i>
                  </Button>
                  <Button
                    variant="link"
                    onClick={() => handleSpotActions.edit(spot.id)}
                    title="Edit Spot"
                  >
                    <i
                      className="bi bi-pencil-square"
                      style={{ color: "black" }}
                    ></i>
                  </Button>
                  <Button
                    variant="link"
                    onClick={() => handleSpotActions.delete(spot.id)}
                    title="Delete Spot"
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

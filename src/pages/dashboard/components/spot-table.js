// Related path: src/pages/dashboard/components/SpotTable.js
import React from "react";
import { Table, Button } from "react-bootstrap";

const SpotTable = ({
  spots,
  handleSpotActions,
  currentTableIndex,
  setCurrentTableIndex,
  pageSize,
  totalSpots,
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
      <Table striped bordered hover>
        <thead
          style={{
            backgroundColor: "#e4e4e4",
          }}
        >
          <tr>
            <th>Spot Name</th>
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
                  <i className="bi bi-trash-fill" style={{ color: "red" }}></i>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <div className="text-right">
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
      </div>
    </div>
  );
};

export default SpotTable;

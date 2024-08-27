// relative path: src/_pages/home/components/spots-table.js. Please do not remove this comment.
import React from "react";
import { Table, Button, Row, Col, Alert } from "react-bootstrap";
import { GenericModal } from "@/components/foundation-components/modal";
import { DownloadLogsModal } from "./download-logs-modal";

const SpotTable = ({
  spots,
  handleSpotActions,
  currentTableIndex,
  setCurrentTableIndex,
  pageSize,
  totalSpots,
  totalDownloads,
  showCopyModal,
  showRenameModal,
  newSpotName,
  setNewSpotName,
  showCreateAdModal,
  adName,
  setAdName,
  setShowCreateAdModal,
  handleNextOnCreateAd,
  setShowCopyModal,
  newCopySpotName,
  setNewCopySpotName,
  handleCloseModal,
  updateSpotName,
  handleSaveCopy,
  setShowRenameModal,
  showDownloadLogsModal,
  setShowDownloadLogsModal,
  downloadLogs,
  unitPrice,
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

      <DownloadLogsModal
        show={showDownloadLogsModal}
        handleClose={() => setShowDownloadLogsModal(false)}
        downloadLogs={downloadLogs}
        unitPrice={unitPrice}
      />

      <GenericModal
        show={showCopyModal}
        onHide={() => setShowCopyModal(false)}
        title="Copy Spot"
        onSave={handleSaveCopy}
        closeButtonLabel="Cancel"
        saveButtonLabel="Copy"
      >
        <input
          type="text"
          value={newCopySpotName}
          onChange={(e) => setNewCopySpotName(e.target.value)}
          className="form-control"
          placeholder="Enter the new Spot name"
        />
      </GenericModal>

      <GenericModal
        show={showRenameModal}
        onHide={() => {
          setShowRenameModal(false);
          setNewSpotName("");
        }}
        title="Rename Spot"
        onSave={updateSpotName}
        closeButtonLabel="Cancel"
        saveButtonLabel="Save"
        maxLength={30}
      >
        <input
          type="text"
          value={newSpotName}
          onChange={(e) => setNewSpotName(e.target.value)}
          className="form-control"
          placeholder="Enter the new Spot name"
        />
      </GenericModal>

      <GenericModal
        show={showCreateAdModal}
        onHide={() => setShowCreateAdModal(false)}
        title="Enter Spot Name"
        onSave={handleNextOnCreateAd}
        closeButtonLabel="Discard"
        saveButtonLabel="Next"
        maxLength={30}
      >
        <input
          type="text"
          value={adName}
          onChange={(e) => setAdName(e.target.value)}
          className="form-control"
          placeholder="Type the Spot name here"
        />
      </GenericModal>
    </div>
  );
};

export default SpotTable;

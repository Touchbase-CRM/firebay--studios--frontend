// relative path: src/_pages/home/components/spots-table.js. Please do not remove this comment.
import React from "react";
import { Table, Dropdown, DropdownButton, Row, Col, Alert, Button } from "react-bootstrap";
import { GenericModal } from "@/components/foundation-components/modal";
import { DownloadLogsModal } from "./download-logs-modal";

const { useState } = React;

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
  const [activeDropdown, setActiveDropdown] = useState(null);

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

  const handleDropdownToggle = (index) => {
    setActiveDropdown((prevIndex) => (prevIndex === index ? null : index));
  };

  return (
    <div style={{ padding: 0, margin: 0, minWidth: "800px" }}>
      {spots.length === 0 ? (
        <Alert variant="info" className="text-center">
          Welcome to Pyro! Click on the "Create a new Spot" button above to get started!
        </Alert>
      ) : (
        <Table style={{ padding: 0, margin: 0 }} borderless>
          <thead style={{ borderBottom: "3px solid black" }}>
            <tr>
              <th>#</th>
              <th>Ad Name</th>
              <th>Voice</th>
              <th>Duration</th>
              <th>Date created</th>
              <th></th>
            </tr>
          </thead>

          <tbody style={{ border: "none" }}>
            {spots.map((spot, index) => (
              <tr key={index} style={{ border: "none" }}>
                <td style={{ border: "none" }}>{index + 1}</td>
                <td style={{ border: "none" }}>{spot.spotName || "-"}</td>
                <td style={{ border: "none" }}>{spot.voice || "-"}</td>
                <td style={{ border: "none" }}>{spot.duration || "-"}</td>
                <td style={{ border: "none" }}>{spot.created || "-"}</td>
                <td style={{ border: "none" }}>
                  <Dropdown
                    drop="up"
                    show={activeDropdown === index}
                    onToggle={() => { }}
                  >
                    <div
                      onClick={() => handleDropdownToggle(index)}
                      style={{
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <i className="bi bi-three-dots"></i>
                    </div>
                    <Dropdown.Menu align="up-centered" style={{ bottom: '100%' }}>
                      <Dropdown.Item onClick={() => handleSpotActions["downloadHistory"](spot.id)}>
                        Download Logs
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleSpotActions["copy"](spot.id)}>
                        Duplicate Spot
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleSpotActions["rename"](spot.id)}>
                        Rename Spot
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleSpotActions["edit"](spot.id)}>
                        Edit Spot
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleSpotActions["delete"](spot.id)}>
                        Delete Spot
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
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

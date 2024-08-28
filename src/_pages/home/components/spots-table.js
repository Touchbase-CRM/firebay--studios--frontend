import React, { useState } from "react";
import { Table, Button, Alert, Row, Col } from "react-bootstrap";
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

  const closeDropdown = () => {
    setActiveDropdown(null);
  };

  return (
    <div style={{ padding: 0, margin: 0, minWidth: "800px" }}>
      {spots.length === 0 ? (
        <Alert variant="info" className="text-center">
          Welcome to Pyro! Click on the "Create a new Spot" button above to get started!
        </Alert>
      ) : (
        <Table style={{ padding: 0, margin: 0 }} borderless>
          <thead style={{ borderBottom: "3px solid #dee2e6" }}>
            <tr>
              <th>#</th>
              <th>Ad Name</th>
              <th>Voice</th>
              <th>Duration</th>
              <th>Date created</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {spots.map((spot, index) => (
              <tr key={index} style={{ borderBottom: "none", height: "48px" }}>
                <td>{index + 1}</td>
                <td>{spot.spotName || "-"}</td>
                <td>{spot.voice || "-"}</td>
                <td>{spot.duration || "-"}</td>
                <td>{spot.created || "-"}</td>
                <td style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Button
                    style={{
                      backgroundColor: "#eb631c",
                      color: "white",
                      borderRadius: "20px",
                      padding: "6px 12px",
                      fontSize: "14px",
                      borderColor: "#eb631c",
                    }}
                    onClick={() => handleSpotActions["edit"](spot.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    style={{
                      backgroundColor: "#f8f9fa",
                      borderColor: "#dee2e6",
                      borderRadius: "20px",
                      padding: "6px 12px",
                      fontSize: "14px",
                      color: "#495057"
                    }}
                  >
                    Share
                  </Button>
                  <i
                    className={`bi ${spot.favorite ? "bi-star-fill" : "bi-star"}`}
                    style={{
                      cursor: "pointer",
                      color: spot.favorite ? "#eb631c" : "#6c757d",
                      fontSize: "18px",
                    }}
                    onClick={() => handleSpotActions["toggleFavorite"](spot.id)}
                  />
                  <div className="dropdown">
                    <i
                      className="bi bi-three-dots"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleDropdownToggle(index)}
                      aria-expanded={activeDropdown === index}
                    ></i>
                    {activeDropdown === index && (
                      <ul
                        className="dropdown-menu show"
                        style={{
                          position: "absolute",
                          transform: "translate3d(0, 0, 0)",
                          top: "100%",
                          left: "auto",
                          right: 0,
                          zIndex: 1000,
                        }}
                        onClick={closeDropdown}
                      >
                        <li onClick={() => handleSpotActions["downloadHistory"](spot.id)}>
                          <span
                            className="dropdown-item"
                            style={{
                              outline: "none",
                              backgroundColor: "#f8f9fa",
                              color: "#495057",
                              boxShadow: "none",
                            }}
                          >
                            Download Logs
                          </span>
                        </li>
                        <li onClick={() => handleSpotActions["copy"](spot.id)}>
                          <span
                            className="dropdown-item"
                            style={{
                              outline: "none",
                              backgroundColor: "#f8f9fa",
                              color: "#495057",
                              boxShadow: "none",
                            }}
                          >
                            Duplicate Spot
                          </span>
                        </li>
                        <li onClick={() => handleSpotActions["rename"](spot.id)}>
                          <span
                            className="dropdown-item"
                            style={{
                              outline: "none",
                              backgroundColor: "#f8f9fa",
                              color: "#495057",
                              boxShadow: "none",
                            }}
                          >
                            Rename Spot
                          </span>
                        </li>
                        <li onClick={() => handleSpotActions["delete"](spot.id)}>
                          <span
                            className="dropdown-item"
                            style={{
                              outline: "none",
                              backgroundColor: "#f8f9fa",
                              color: "#495057",
                              boxShadow: "none",
                            }}
                          >
                            Delete Spot
                          </span>
                        </li>
                        <li>
                          <hr className="dropdown-divider" />
                        </li>
                        <li onClick={closeDropdown}>
                          <span
                            className="dropdown-item"
                            style={{
                              outline: "none",
                              backgroundColor: "#f8f9fa",
                              color: "#495057",
                              boxShadow: "none",
                            }}
                          >
                            Cancel
                          </span>
                        </li>
                      </ul>
                    )}
                  </div>

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

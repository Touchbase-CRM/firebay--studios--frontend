// components/download-logs-modal.js
import React from "react";
import { Modal, Button } from "react-bootstrap";
import DownloadLogsTable from "./ComponentB";

const DownloadLogsModal = ({ show, handleClose, downloadLogs }) => {
  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Download Logs</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <DownloadLogsTable downloadLogs={downloadLogs} />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DownloadLogsModal;

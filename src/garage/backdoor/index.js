// pages/download-logs.js
import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import DownloadLogsModal from "./ComponentA";

const DownloadLogsPage = () => {
  const [downloadLogs, setDownloadLogs] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Fetch download logs from Firestore or any other source
    const fetchDownloadLogs = async () => {
      // Replace this with your actual fetch logic
      const logs = [
        {
          downloadFileName: "file1.mp3",
          downloadTime: "2024-05-14T10:00:00Z",
        },
        {
          downloadFileName: "file2.mp3",
          downloadTime: "2024-05-14T11:00:00Z",
        },
      ];
      setDownloadLogs(logs);
    };

    fetchDownloadLogs();
  }, []);

  const handleShow = () => setShowModal(true);
  const handleClose = () => setShowModal(false);

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Download Logs</h1>
      <Button variant="primary" onClick={handleShow}>
        View Download Logs
      </Button>

      <DownloadLogsModal
        show={showModal}
        handleClose={handleClose}
        downloadLogs={downloadLogs}
      />
    </div>
  );
};

export default DownloadLogsPage;

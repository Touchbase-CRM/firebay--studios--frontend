// Related path: src/pages/home/components/spots-manager.js
import React from "react";
import { GenericModal } from "@/components/foundation-components/modal";
import { DownloadLogsModal } from "./download-logs-modal";
import { useState } from "react";

const ManageSpotTableActions = ({
  showCopyModal,
  showRenameModal,
  newSpotName,
  setNewSpotName,
  showCreateAdModal,
  adName,
  setAdName,
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
}) => {
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
  console.log("downloadLogs at manage-spots table actions", downloadLogs);
  return (
    <>
      <DownloadLogsModal
        show={showDownloadLogsModal}
        handleClose={() => setShowDownloadLogsModal(false)}
        downloadLogs={downloadLogs}
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
      >
        <input
          type="text"
          value={adName}
          onChange={(e) => setAdName(e.target.value)}
          className="form-control"
          placeholder="Type the Spot name here"
        />
      </GenericModal>
    </>
  );
};

export default ManageSpotTableActions;

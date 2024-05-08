// Related path: src/pages/dashboard/components/spots-manager.js
import React from "react";
import { GenericModal } from "@/components/foundationComponents/modal";

const SpotsManagerModal = ({
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
}) => {
  return (
    <>
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
        onHide={() => setNewSpotName("")}
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
        onHide={handleCloseModal}
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

export default SpotsManagerModal;

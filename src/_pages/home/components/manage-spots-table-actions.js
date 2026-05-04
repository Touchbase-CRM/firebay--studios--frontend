import React from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { DownloadLogsModal } from "./download-logs-modal";

const ManageSpotTableActions = ({
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
  return (
    <>
      <DownloadLogsModal
        show={showDownloadLogsModal}
        handleClose={() => setShowDownloadLogsModal(false)}
        downloadLogs={downloadLogs}
        unitPrice={unitPrice}
      />

      <Modal
        show={showCopyModal}
        onHide={() => setShowCopyModal(false)}
        title="Duplicate spot"
        description="Give the copy a unique name to keep your library tidy."
        primaryAction={{ label: "Duplicate", onClick: handleSaveCopy }}
        secondaryAction={{ label: "Cancel", onClick: () => setShowCopyModal(false) }}
      >
        <Input
          autoFocus
          value={newCopySpotName}
          onChange={(e) => setNewCopySpotName(e.target.value)}
          placeholder="Spot name"
          maxLength={30}
        />
      </Modal>

      <Modal
        show={showRenameModal}
        onHide={() => {
          setShowRenameModal(false);
          setNewSpotName("");
        }}
        title="Rename spot"
        primaryAction={{ label: "Save", onClick: updateSpotName }}
        secondaryAction={{
          label: "Cancel",
          onClick: () => {
            setShowRenameModal(false);
            setNewSpotName("");
          },
        }}
      >
        <Input
          autoFocus
          value={newSpotName}
          onChange={(e) => setNewSpotName(e.target.value)}
          placeholder="Spot name"
          maxLength={30}
        />
      </Modal>

      <Modal
        show={showCreateAdModal}
        onHide={() => {
          if (handleCloseModal) handleCloseModal();
          else setShowCreateAdModal(false);
        }}
        title="Create a new spot"
        description="Name your spot — you can change it any time."
        primaryAction={{ label: "Continue", onClick: handleNextOnCreateAd }}
        secondaryAction={{
          label: "Discard",
          onClick: () => {
            if (handleCloseModal) handleCloseModal();
            else setShowCreateAdModal(false);
          },
        }}
      >
        <Input
          autoFocus
          value={adName}
          onChange={(e) => setAdName(e.target.value)}
          placeholder="e.g. Acme Q4 Radio"
          maxLength={30}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleNextOnCreateAd();
          }}
        />
      </Modal>
    </>
  );
};

export default ManageSpotTableActions;

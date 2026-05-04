import React from "react";
import { Modal } from "@/components/ui/modal";
import DownloadLogsTable from "./download-logs-table";

export const DownloadLogsModal = ({ show, handleClose, downloadLogs, unitPrice }) => {
  return (
    <Modal
      show={show}
      onHide={handleClose}
      title="Download history"
      description="Each download counts toward this month's billing."
      size="lg"
      primaryAction={{ label: "Close", onClick: handleClose, variant: "secondary" }}
    >
      <DownloadLogsTable downloadLogs={downloadLogs} unitPrice={unitPrice} />
    </Modal>
  );
};

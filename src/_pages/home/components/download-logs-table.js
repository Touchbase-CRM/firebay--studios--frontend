import React from "react";
import { EmptyState } from "@/components/ui/empty-state";

const DownloadLogsTable = ({ downloadLogs, unitPrice }) => {
  if (!downloadLogs || downloadLogs.length === 0) {
    return (
      <EmptyState
        icon={<i className="bi bi-download" />}
        title="No downloads yet"
        description="Once this spot is downloaded, the history will appear here."
      />
    );
  }

  const total = downloadLogs.length * (unitPrice || 0);

  return (
    <div style={{ maxHeight: 420, overflowY: "auto" }}>
      <table className="table" style={{ marginBottom: 0 }}>
        <thead>
          <tr>
            <th>File</th>
            <th>Downloaded</th>
            <th style={{ textAlign: "right" }}>Charge</th>
          </tr>
        </thead>
        <tbody>
          {downloadLogs.map((log, idx) => (
            <tr key={idx}>
              <td style={{ fontWeight: "var(--font-weight-medium)", color: "var(--text-primary)" }}>
                {log.downloadFileName}
              </td>
              <td style={{ color: "var(--text-secondary)" }}>
                {new Date(log.downloadTime).toLocaleString()}
              </td>
              <td style={{ textAlign: "right", color: "var(--text-secondary)" }}>
                ${(unitPrice || 0).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="2" style={{ textAlign: "right", fontWeight: "var(--font-weight-semibold)" }}>
              Total
            </td>
            <td style={{ textAlign: "right", fontWeight: "var(--font-weight-semibold)", color: "var(--text-primary)" }}>
              ${total.toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default DownloadLogsTable;

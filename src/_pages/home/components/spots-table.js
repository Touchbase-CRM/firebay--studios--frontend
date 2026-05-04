import React from "react";
import { Dropdown } from "react-bootstrap";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

const KebabIcon = () => <i className="bi bi-three-dots" style={{ fontSize: 16 }} />;

function PaginationFooter({ currentTableIndex, pageSize, totalSpots, totalDownloads, onPrev, onNext }) {
  const start = totalSpots === 0 ? 0 : currentTableIndex + 1;
  const end = Math.min(currentTableIndex + pageSize, totalSpots);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-4)",
        padding: "var(--space-4) var(--space-5)",
        borderTop: "1px solid var(--border-subtle)",
        fontSize: "var(--text-sm)",
        color: "var(--text-secondary)",
      }}
    >
      <div>
        {totalSpots > 0
          ? `Showing ${start}–${end} of ${totalSpots}`
          : "No spots"}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        {totalDownloads != null && totalDownloads > 0 && (
          <span>
            <strong style={{ color: "var(--text-primary)" }}>{totalDownloads}</strong> downloads
            this month
          </span>
        )}
        <div style={{ display: "flex", gap: "var(--space-1)" }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={onPrev}
            disabled={currentTableIndex === 0}
            aria-label="Previous page"
          >
            <i className="bi bi-chevron-left" style={{ fontSize: 12 }} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onNext}
            disabled={currentTableIndex + pageSize >= totalSpots}
            aria-label="Next page"
          >
            <i className="bi bi-chevron-right" style={{ fontSize: 12 }} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function SpotRow({ spot, handleSpotActions }) {
  const onRowClick = () => handleSpotActions.edit(spot.id);
  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn();
  };

  return (
    <tr
      onClick={onRowClick}
      style={{ cursor: "pointer" }}
      className="pyro-spot-row"
      data-cy="spot-row"
      data-cy-spot-name={spot.spotName}
    >
      <td style={{ fontWeight: "var(--font-weight-medium)", color: "var(--text-primary)" }}>
        {spot.spotName || "Untitled spot"}
      </td>
      <td style={{ color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
        {spot.created || "—"}
      </td>
      <td
        onClick={(e) => e.stopPropagation()}
        style={{ width: 48, textAlign: "right" }}
      >
        <Dropdown align="end" autoClose>
          <Dropdown.Toggle
            as="button"
            id={`spot-${spot.id}-actions`}
            aria-label="Spot actions"
            style={{
              background: "transparent",
              border: "none",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-1) var(--space-2)",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
            bsPrefix="pyro-kebab"
          >
            <KebabIcon />
          </Dropdown.Toggle>
          <Dropdown.Menu renderOnMount popperConfig={{ strategy: "fixed" }}>
            <Dropdown.Item onClick={() => handleSpotActions.edit(spot.id)}>
              <i className="bi bi-pencil-square" style={{ marginRight: 8 }} />
              Edit
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleSpotActions.rename(spot.id)}>
              <i className="bi bi-input-cursor-text" style={{ marginRight: 8 }} />
              Rename
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleSpotActions.copy(spot.id)}>
              <i className="bi bi-files" style={{ marginRight: 8 }} />
              Duplicate
            </Dropdown.Item>
            <Dropdown.Item
              onClick={() => handleSpotActions.downloadHistory(spot.id)}
              disabled={!spot.downloadLogs || spot.downloadLogs.length === 0}
            >
              <i className="bi bi-clock-history" style={{ marginRight: 8 }} />
              Download history
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item
              onClick={() => handleSpotActions.delete(spot.id)}
              style={{ color: "var(--danger-500)" }}
            >
              <i className="bi bi-trash" style={{ marginRight: 8 }} />
              Delete
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </td>
    </tr>
  );
}

const SpotTable = ({
  spots,
  handleSpotActions,
  currentTableIndex,
  setCurrentTableIndex,
  pageSize,
  totalSpots,
  totalDownloads,
  onCreate,
}) => {
  const onPrev = () => {
    if (currentTableIndex - pageSize >= 0) setCurrentTableIndex(currentTableIndex - pageSize);
  };
  const onNext = () => {
    if (currentTableIndex + pageSize < totalSpots) setCurrentTableIndex(currentTableIndex + pageSize);
  };

  return (
    <div
      style={{
        backgroundColor: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-xs)",
        overflow: "visible",
      }}
    >
      <style>{`
        .pyro-spot-row:hover { background-color: var(--gray-50); }
      `}</style>
      {totalSpots === 0 ? (
        <EmptyState
          icon={<i className="bi bi-mic" />}
          title="No spots yet"
          description="Create your first ad to get started. You'll write a script, shape it section-by-section, then stitch and export."
          action={
            onCreate && (
              <Button onClick={onCreate}>Create your first spot</Button>
            )
          }
        />
      ) : (
        <table className="table" style={{ marginBottom: 0 }}>
          <thead>
            <tr>
              <th>Spot name</th>
              <th>Created</th>
              <th style={{ width: 48 }}></th>
            </tr>
          </thead>
          <tbody>
            {spots.map((spot) => (
              <SpotRow key={spot.id} spot={spot} handleSpotActions={handleSpotActions} />
            ))}
          </tbody>
        </table>
      )}

      {totalSpots > 0 && (
        <PaginationFooter
          currentTableIndex={currentTableIndex}
          pageSize={pageSize}
          totalSpots={totalSpots}
          totalDownloads={totalDownloads}
          onPrev={onPrev}
          onNext={onNext}
        />
      )}
    </div>
  );
};

export default SpotTable;

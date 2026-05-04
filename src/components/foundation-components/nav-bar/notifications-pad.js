import React from "react";
import { Offcanvas } from "react-bootstrap";
import { formatDate } from "@/utils/time/current-timestamp";
import { EmptyState } from "@/components/ui/empty-state";

export const NotificationsPad = ({ show, handleClose, notifications, deleteNotification }) => {
  return (
    <Offcanvas show={show} onHide={handleClose} placement="end" style={{ width: "440px" }}>
      <Offcanvas.Header closeButton>
        <Offcanvas.Title style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-weight-semibold)" }}>
          Notifications
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body style={{ padding: "var(--space-4) var(--space-5)" }}>
        {notifications.length === 0 ? (
          <EmptyState
            icon={<i className="bi bi-bell" />}
            title="No notifications"
            description="You're all caught up. New activity will appear here."
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: "var(--space-4)",
                  backgroundColor: "var(--surface-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-3)" }}>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "var(--text-sm)",
                        fontWeight: "var(--font-weight-semibold)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {n.title}
                    </div>
                    <div
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--text-muted)",
                        marginTop: "var(--space-1)",
                      }}
                    >
                      {formatDate(n.timestamp)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteNotification(n.id)}
                    aria-label="Dismiss"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: 0,
                      lineHeight: 1,
                    }}
                  >
                    <i className="bi bi-x" style={{ fontSize: 18 }}></i>
                  </button>
                </div>
                <div
                  style={{
                    marginTop: "var(--space-2)",
                    fontSize: "var(--text-sm)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {n.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
};

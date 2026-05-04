import React from "react";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

const DetectedSections = ({ show, handleClose, sections }) => {
  return (
    <Drawer
      show={show}
      onHide={handleClose}
      title="Detected sections"
      description="Each section becomes its own voice take. Edit the script to change them."
      width="520px"
    >
      {sections.length === 0 ? (
        <EmptyState
          icon={<i className="bi bi-list-task" />}
          title="No sections yet"
          description="Add some text and use // marks to split it into sections."
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {sections.map((section) => (
            <div
              key={section.getIndex()}
              style={{
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-4)",
                backgroundColor: "var(--surface-card)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-2)" }}>
                <Badge tone="accent">Section {section.getIndex() + 1}</Badge>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                  {section.getOriginalCharCount()} characters
                </span>
              </div>
              <div
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--text-primary)",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.55,
                }}
              >
                {section.getOriginalContent()}
              </div>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
};

export default DetectedSections;

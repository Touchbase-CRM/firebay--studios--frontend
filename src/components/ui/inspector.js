import React, { useState } from "react";
import { Tabs } from "./tabs";

export function Inspector({
  tabs,
  defaultTab,
  value,
  onChange,
  headerActions,
  width = "var(--inspector-width)",
  style,
}) {
  const [internal, setInternal] = useState(defaultTab || tabs[0]?.value);
  const active = value !== undefined ? value : internal;
  const setActive = (next) => {
    if (onChange) onChange(next);
    if (value === undefined) setInternal(next);
  };
  const activeTab = tabs.find((t) => t.value === active) || tabs[0];

  return (
    <aside
      style={{
        width,
        flexShrink: 0,
        backgroundColor: "var(--surface-card)",
        borderLeft: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        minWidth: 0,
        minHeight: 0,
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          paddingTop: "var(--space-4)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 var(--space-5)",
          }}
        >
          <Tabs
            value={active}
            onChange={setActive}
            items={tabs.map(({ value, label, icon, badge, disabled }) => ({
              value,
              label,
              icon,
              badge,
              disabled,
            }))}
            style={{ flex: 1, border: "none" }}
          />
          {headerActions && (
            <div style={{ display: "flex", gap: "var(--space-1)", paddingLeft: "var(--space-3)" }}>
              {headerActions}
            </div>
          )}
        </div>
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "var(--space-5)",
        }}
      >
        {activeTab?.content}
      </div>
      {activeTab?.footer && (
        <div
          style={{
            borderTop: "1px solid var(--border-subtle)",
            padding: "var(--space-4) var(--space-5)",
            display: "flex",
            gap: "var(--space-2)",
            justifyContent: "flex-end",
            backgroundColor: "var(--surface-card)",
          }}
        >
          {activeTab.footer}
        </div>
      )}
    </aside>
  );
}

export default Inspector;

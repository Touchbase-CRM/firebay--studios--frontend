import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export function HistoryTab({ historyMap, onPlay, onRestore }) {
  const entries = historyMap ? Array.from(historyMap.entries()) : [];

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<i className="bi bi-clock-history" />}
        title="No takes yet"
        description="Generate a voice and your past takes will appear here."
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      {entries.map(([key, section], idx) => (
        <Card key={key} variant="bordered" padding="var(--space-4)">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-2)" }}>
            <Badge tone="neutral">Take {idx + 1}</Badge>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
              {section.getVoiceName()}
            </span>
          </div>
          <div
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--text-secondary)",
              marginBottom: "var(--space-3)",
              lineHeight: 1.5,
              fontFamily: "var(--font-mono)",
              whiteSpace: "pre-wrap",
            }}
          >
            {section.getCurrentWords().join(" ")}
          </div>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onPlay(section.getGeneratedVoiceUrl())}
              leftIcon={<i className="bi bi-play-fill" />}
            >
              Play
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onRestore(section)}>
              Restore this take
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default HistoryTab;

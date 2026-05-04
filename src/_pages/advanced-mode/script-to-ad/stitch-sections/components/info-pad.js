import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const InfoPad = ({
  localSectionsArray,
  adLength,
  combinedVoiceoverUrl,
  setForceRenderKey,
  setShowAudioPlayer,
  setNowPlayingUrl,
  setAudioTitle,
}) => {
  const totalNoPauses = localSectionsArray
    .reduce((acc, s) => acc + s.sectionDurationSeconds, 0)
    .toFixed(2);
  const totalWithPauses = localSectionsArray
    .reduce((acc, s) => acc + s.sectionDurationSeconds + s.getEndOfSectionPauseDurationSeconds(), 0)
    .toFixed(2);
  const overBudget = parseFloat(totalWithPauses) > adLength;

  return (
    <div
      style={{
        marginTop: "var(--space-5)",
        padding: "var(--space-4)",
        backgroundColor: "var(--surface-inset)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-subtle)",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-3)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: "var(--font-weight-semibold)" }}>
          Total duration
        </span>
        <span style={{ fontSize: "var(--text-md)", color: "var(--text-primary)", fontWeight: "var(--font-weight-semibold)" }}>
          {totalWithPauses}s <span style={{ color: "var(--text-muted)", fontWeight: "var(--font-weight-regular)", fontSize: "var(--text-sm)" }}>/ {adLength}s budget</span>
        </span>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
          Voice only: {totalNoPauses}s
        </span>
      </div>
      {overBudget && <Badge tone="warning">Over budget</Badge>}
      {combinedVoiceoverUrl && (
        <Button
          variant="secondary"
          leftIcon={<i className="bi bi-play-fill" />}
          onClick={(e) => {
            e.stopPropagation();
            setForceRenderKey(Math.random().toString());
            setShowAudioPlayer(true);
            setNowPlayingUrl(combinedVoiceoverUrl);
            setAudioTitle("Final Cut");
          }}
        >
          Replay final cut
        </Button>
      )}
    </div>
  );
};

export default InfoPad;

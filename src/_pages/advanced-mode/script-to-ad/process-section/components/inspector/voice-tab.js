import React from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { Slider } from "@/components/ui/slider";
import { VoicePicker } from "./voice-picker";

function FieldLabel({ children, info }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-1)",
        fontSize: "var(--text-sm)",
        fontWeight: "var(--font-weight-medium)",
        color: "var(--text-secondary)",
        marginBottom: "var(--space-3)",
      }}
    >
      {children}
      {info && (
        <OverlayTrigger placement="top" overlay={<Tooltip>{info}</Tooltip>}>
          <i
            className="bi bi-info-circle"
            style={{ fontSize: 12, color: "var(--text-muted)", cursor: "help" }}
          />
        </OverlayTrigger>
      )}
    </div>
  );
}

export function VoiceTab({
  voiceGroups,
  voiceMeta,
  voiceName,
  onVoiceChange,
  onVoicePreview,
  previewingVoice,
  intonation,
  onIntonationChange,
  speechRate,
  onSpeechRateChange,
  emphasis,
}) {
  const isLoading = !voiceGroups || !voiceGroups.some((g) => g.voices.length > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <div>
        <VoicePicker
          groups={voiceGroups}
          meta={voiceMeta}
          value={voiceName}
          onChange={onVoiceChange}
          onPreview={onVoicePreview}
          previewing={previewingVoice}
          disabled={isLoading}
        />
      </div>

      <div>
        {/* Shown as "Read variation", the inverse of the stored intonation
            consistency (ElevenLabs stability): 100 − consistency. */}
        <FieldLabel info="Higher = more variety between takes. Lower = consistent reads.">
          Read variation
        </FieldLabel>
        <Slider
          min={0}
          max={100}
          value={100 - intonation}
          onValueChange={(variation) => onIntonationChange(100 - variation)}
          showPercentage
          width="100%"
          height="6px"
        />
      </div>

      <div>
        <FieldLabel info="Slow the voice down or speed it up. Reset to default with the link below.">
          Speech rate
        </FieldLabel>
        <Slider
          min={0}
          max={100}
          value={speechRate}
          onValueChange={onSpeechRateChange}
          showPercentage
          width="100%"
          height="6px"
        />
      </div>

      {emphasis && (
        <div>
          <FieldLabel>Emphasis</FieldLabel>
          {emphasis}
        </div>
      )}
    </div>
  );
}

export default VoiceTab;

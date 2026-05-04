import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

const EMPHASIS_LEVELS = [
  { action: "emphasizeLevel1", label: "Low",    tone: "var(--accent-300)" },
  { action: "emphasizeLevel2", label: "Medium", tone: "var(--accent-500)" },
  { action: "emphasizeLevel3", label: "High",   tone: "var(--accent-700)" },
];

function emphasisLevel(transformedWord, originalWord) {
  if (!transformedWord || transformedWord === originalWord) return null;
  if (transformedWord === `'${originalWord.toUpperCase()}'`) return 3;
  if (transformedWord.startsWith("'") && transformedWord.endsWith("'")) return 2;
  if (transformedWord === originalWord.toUpperCase()) return 1;
  return null;
}

export function EmphasisTab({
  words,
  transformedWords,
  selectedWordIndex,
  onWordSelect,
  onTransform,
}) {
  if (!words || words.length === 0) {
    return (
      <EmptyState
        icon={<i className="bi bi-type-bold" />}
        title="No words to emphasize"
        description="Type something in the script editor first."
      />
    );
  }

  const selectedWord = selectedWordIndex != null ? words[selectedWordIndex] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
        Click a word to emphasize it. Three levels of emphasis are available.
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--space-1)",
          padding: "var(--space-3)",
          backgroundColor: "var(--surface-inset)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {words.map((word, idx) => {
          const transformed = transformedWords[idx];
          const level = emphasisLevel(transformed, word);
          const isSelected = idx === selectedWordIndex;
          const tone =
            level === 1 ? "var(--accent-300)" :
            level === 2 ? "var(--accent-500)" :
            level === 3 ? "var(--accent-700)" : "transparent";

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onWordSelect(idx)}
              style={{
                background: isSelected ? "var(--accent-50)" : "var(--surface-card)",
                border: `1px solid ${isSelected ? "var(--accent-500)" : level ? tone : "var(--border-subtle)"}`,
                borderRadius: "var(--radius-sm)",
                padding: "4px 8px",
                fontSize: "var(--text-sm)",
                fontWeight: level ? "var(--font-weight-semibold)" : "var(--font-weight-regular)",
                color: "var(--text-primary)",
                cursor: "pointer",
                transition: "background-color var(--duration-base) var(--ease-out), border-color var(--duration-base) var(--ease-out)",
                maxWidth: "100%",
                wordBreak: "break-word",
                overflowWrap: "anywhere",
                textAlign: "left",
                fontFamily: "inherit",
              }}
            >
              {transformed || word}
            </button>
          );
        })}
      </div>

      {selectedWord && (
        <div
          style={{
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-4)",
            backgroundColor: "var(--surface-card)",
          }}
        >
          <div
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--text-secondary)",
              marginBottom: "var(--space-2)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
            }}
          >
            Emphasizing
            <Badge tone="accent">{selectedWord}</Badge>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
            {EMPHASIS_LEVELS.map((level) => (
              <Button
                key={level.action}
                size="sm"
                variant="secondary"
                onClick={() => onTransform(level.action)}
              >
                {level.label} emphasis
              </Button>
            ))}
            <Button size="sm" variant="ghost" onClick={() => onTransform("removeEmphasis")}>
              Remove
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmphasisTab;

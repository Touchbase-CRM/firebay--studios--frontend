import React, { useEffect, useRef, useState } from "react";
import styles from "./emphasis-tab.module.css";

// The highlighter tools. 0 is the eraser.
const TOOLS = [
  { level: 1, label: "Light" },
  { level: 2, label: "Medium" },
  { level: 3, label: "Strong" },
  { level: 0, label: "Eraser" },
];
const LEVEL_CLASS = { 1: styles.level1, 2: styles.level2, 3: styles.level3 };

// Emphasis is stored as a transformed word: WORD (light), 'word' (medium),
// 'WORD' (strong).
export function emphasisLevel(transformedWord, originalWord) {
  if (!transformedWord || transformedWord === originalWord) return 0;
  if (transformedWord === `'${originalWord.toUpperCase()}'`) return 3;
  if (transformedWord.startsWith("'") && transformedWord.endsWith("'")) return 2;
  if (transformedWord === originalWord.toUpperCase()) return 1;
  return 0;
}

// Highlighter model: pick a tool, then tap words to apply it. Tapping a word
// that already has the tool's level clears it. Dragging (mouse or finger)
// paints every word it passes over with what the first tap did. No tool is
// picked at first; tapping a word before picking one nudges the tools.
export function EmphasisTab({ words, transformedWords, onSetLevel }) {
  const [tool, setTool] = useState(null);
  const [nudge, setNudge] = useState(0);
  const stroke = useRef(null); // level being painted during a drag
  const painted = useRef(new Set());

  useEffect(() => {
    const end = () => {
      stroke.current = null;
      painted.current = new Set();
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, []);

  // Blank entries come from double spaces / line breaks in the script.
  const indices = words.map((w, i) => (w.trim() ? i : null)).filter((i) => i !== null);
  if (indices.length === 0) {
    return (
      <div>
        <div className={styles.header}>
          <span className={styles.title}>Emphasis</span>
        </div>
        <div className={styles.empty}>No words yet.</div>
      </div>
    );
  }

  const levelOf = (i) => emphasisLevel(transformedWords[i], words[i]);
  const hasEmphasis = indices.some((i) => levelOf(i) > 0);

  const paint = (i) => {
    if (stroke.current == null || painted.current.has(i)) return;
    painted.current.add(i);
    if (levelOf(i) !== stroke.current) onSetLevel([i], stroke.current);
  };

  const start = (e, i) => {
    e.preventDefault();
    if (tool == null) {
      setNudge((n) => n + 1);
      return;
    }
    stroke.current = tool !== 0 && levelOf(i) === tool ? 0 : tool;
    painted.current = new Set();
    paint(i);
  };

  // pointerenter doesn't fire on other elements during a touch drag, so find
  // the word under the finger instead.
  const move = (e) => {
    if (stroke.current == null) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const i = el?.dataset?.wordIndex;
    if (i != null) paint(Number(i));
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.title}>Emphasis</span>
        <button
          type="button"
          className={styles.clearAll}
          onClick={() => onSetLevel(indices, 0)}
          disabled={!hasEmphasis}
          data-cy="emphasis-clear-all"
        >
          Clear all
        </button>
      </div>

      <div
        key={nudge}
        className={`${styles.tools} ${nudge ? styles.nudge : ""}`}
        role="radiogroup"
        aria-label="Highlighter"
      >
        {TOOLS.map((t) => (
          <button
            key={t.level}
            type="button"
            role="radio"
            aria-checked={tool === t.level}
            className={`${styles.tool} ${tool === t.level ? styles.toolOn : ""}`}
            onClick={() => setTool(t.level)}
            data-cy={`emphasis-tool-${t.label.toLowerCase()}`}
          >
            <span
              className={`${styles.toolLabel} ${
                t.level === 0 ? styles.eraserLabel : LEVEL_CLASS[t.level]
              }`}
            >
              {t.level === 0 && <i className="bi bi-eraser" aria-hidden />}
              {t.label}
            </span>
          </button>
        ))}
      </div>

      <div className={styles.words} onPointerMove={move} data-cy="emphasis-words">
        {indices.map((i) => {
          const level = levelOf(i);
          return (
            <button
              key={i}
              type="button"
              data-word-index={i}
              className={`${styles.word} ${LEVEL_CLASS[level] || ""}`}
              onPointerDown={(e) => start(e, i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (tool == null) return setNudge((n) => n + 1);
                  onSetLevel([i], tool !== 0 && level === tool ? 0 : tool);
                }
              }}
              aria-label={`${words[i]}${level ? `, ${TOOLS.find((t) => t.level === level).label} emphasis` : ""}`}
            >
              {words[i]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default EmphasisTab;

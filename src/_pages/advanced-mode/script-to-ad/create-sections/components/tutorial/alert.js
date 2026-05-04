import React from "react";
import { CopyBox } from "./copy-box";

export const SectioningTutorial = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <section>
        <h3
          style={{
            fontSize: "var(--text-md)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--text-primary)",
            margin: 0,
            marginBottom: "var(--space-2)",
          }}
        >
          What is a section?
        </h3>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", margin: 0, lineHeight: 1.55 }}>
          A section is a chunk of script that shares the same voice, energy, or pacing. The more
          sections you create, the more control you have over each take.
        </p>
      </section>

      <section>
        <h3
          style={{
            fontSize: "var(--text-md)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--text-primary)",
            margin: 0,
            marginBottom: "var(--space-2)",
          }}
        >
          One section
        </h3>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", margin: "0 0 var(--space-3)", lineHeight: 1.55 }}>
          Without any breaks, the whole script is a single section.
        </p>
        <CopyBox text="The quick brown fox jumps over the lazy dog." />
      </section>

      <section>
        <h3
          style={{
            fontSize: "var(--text-md)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--text-primary)",
            margin: 0,
            marginBottom: "var(--space-2)",
          }}
        >
          Multiple sections
        </h3>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", margin: "0 0 var(--space-3)", lineHeight: 1.55 }}>
          Add a <code style={{ background: "var(--gray-100)", padding: "0 6px", borderRadius: 4 }}>//</code>{" "}
          wherever you want to break. The example below splits into four sections.
        </p>
        <CopyBox text="The quick brown fox// jumps //over the lazy // dog." />
      </section>
    </div>
  );
};

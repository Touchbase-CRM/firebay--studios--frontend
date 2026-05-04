import React from "react";

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
    <path
      d="M11.0834 3.5L5.25008 9.33333L2.91675 7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function Stepper({ steps, current, onStepClick, style }) {
  return (
    <div
      role="navigation"
      aria-label="Progress"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-3)",
        padding: "var(--space-3) var(--space-6)",
        backgroundColor: "var(--surface-card)",
        borderBottom: "1px solid var(--border-subtle)",
        ...style,
      }}
    >
      {steps.map((step, idx) => {
        const isCompleted = idx < current;
        const isActive = idx === current;
        const isClickable = isCompleted && !!onStepClick;
        return (
          <React.Fragment key={step.label || idx}>
            <button
              type="button"
              onClick={() => (isClickable ? onStepClick(idx) : undefined)}
              disabled={!isClickable}
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: isClickable ? "pointer" : "default",
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-2)",
                fontFamily: "inherit",
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "var(--radius-full)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--font-weight-semibold)",
                  backgroundColor: isCompleted
                    ? "var(--gray-700)"
                    : isActive
                    ? "var(--accent-500)"
                    : "transparent",
                  color: isCompleted || isActive ? "var(--text-inverse)" : "var(--text-muted)",
                  border: isCompleted || isActive ? "none" : "1px solid var(--border-strong)",
                  transition: "background-color var(--duration-base) var(--ease-out)",
                }}
              >
                {isCompleted ? <CheckIcon /> : idx + 1}
              </span>
              <span
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: isActive
                    ? "var(--font-weight-semibold)"
                    : "var(--font-weight-medium)",
                  color: isActive
                    ? "var(--text-primary)"
                    : isCompleted
                    ? "var(--text-secondary)"
                    : "var(--text-muted)",
                }}
              >
                {step.label}
              </span>
            </button>
            {idx < steps.length - 1 && (
              <span
                aria-hidden
                style={{
                  flex: "0 1 var(--space-7)",
                  height: 1,
                  backgroundColor: isCompleted
                    ? "var(--gray-700)"
                    : "var(--border-subtle)",
                  minWidth: "var(--space-5)",
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default Stepper;

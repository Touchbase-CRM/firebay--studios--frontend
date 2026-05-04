import React from "react";
import { Button } from "@/components/ui/button";

const NavigationButtons = ({ handlePreviousPage, handleNextPage, currentPage, totalPages }) => {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "var(--space-4)" }}>
      <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
        Page {currentPage} of {totalPages}
      </span>
      <div style={{ display: "flex", gap: "var(--space-1)" }}>
        <Button
          variant="secondary"
          size="sm"
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          aria-label="Previous"
        >
          <i className="bi bi-chevron-left" style={{ fontSize: 12 }} />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          aria-label="Next"
        >
          <i className="bi bi-chevron-right" style={{ fontSize: 12 }} />
        </Button>
      </div>
    </div>
  );
};

export default NavigationButtons;

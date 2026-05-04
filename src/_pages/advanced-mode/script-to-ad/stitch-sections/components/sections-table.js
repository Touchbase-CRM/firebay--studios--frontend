import React from "react";
import { PlayButton } from "@/components/buttons/play-button/play";
import { EditButton } from "@/components/buttons/edit-button/edit";
import { EditPauseDurationModal } from "./edit-pause-duration-modal/modal";

const SectionsTable = ({
  currentSections,
  indexOfFirstSection,
  handleContentClick,
  showEditPauseDurationModal,
  isEditPauseModalVisible,
  setEditPauseModalVisible,
  updatePauseDuration,
  currentEditingSectionIndex,
  adLength,
  localSectionsArray,
  handleSectionPreviewPlay,
  handleEditSection,
}) => {
  return (
    <div style={{ overflow: "auto" }}>
      <table className="table" style={{ marginBottom: 0 }}>
        <thead>
          <tr>
            <th style={{ width: 60 }}>#</th>
            <th>Voice</th>
            <th>Content</th>
            <th style={{ textAlign: "right" }}>Duration</th>
            <th>End pause</th>
            <th style={{ width: 100, textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentSections.map((section, idx) => {
            const absoluteIdx = indexOfFirstSection + idx;
            const content = section.getCurrentContent();
            return (
              <tr key={absoluteIdx}>
                <td style={{ fontWeight: "var(--font-weight-medium)", color: "var(--text-secondary)" }}>
                  {absoluteIdx + 1}
                </td>
                <td>{section.getVoiceName()}</td>
                <td
                  onClick={() => handleContentClick(content)}
                  style={{ cursor: "pointer", maxWidth: 360 }}
                >
                  {content.length > 60 ? (
                    <>
                      <span style={{ color: "var(--text-primary)" }}>
                        {content.substring(0, 60)}
                      </span>
                      <span style={{ color: "var(--text-muted)" }}> …see more</span>
                    </>
                  ) : (
                    content
                  )}
                </td>
                <td style={{ textAlign: "right", color: "var(--text-secondary)" }}>
                  {section.getSectionDurationSeconds().toFixed(2)}s
                </td>
                <td>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <span style={{ color: "var(--text-secondary)" }}>
                      {section.getEndOfSectionPauseDurationSeconds()}s
                    </span>
                    <EditButton
                      onClickHandler={() => showEditPauseDurationModal(absoluteIdx)}
                    />
                    <EditPauseDurationModal
                      show={isEditPauseModalVisible}
                      onHide={() => setEditPauseModalVisible(false)}
                      initialValue={section.getEndOfSectionPauseDurationSeconds()}
                      onSave={(newPauseDuration) => {
                        if (currentEditingSectionIndex !== null) {
                          updatePauseDuration(currentEditingSectionIndex, newPauseDuration);
                        }
                        setEditPauseModalVisible(false);
                      }}
                      maxValue={Math.floor(
                        adLength -
                          localSectionsArray.reduce(
                            (acc, s) =>
                              acc +
                              s.sectionDurationSeconds +
                              s.getEndOfSectionPauseDurationSeconds(),
                            0
                          )
                      )}
                    />
                  </div>
                </td>
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "inline-flex", gap: "var(--space-1)" }}>
                    {section.getHistoryItemId() ? (
                      <PlayButton
                        onClickHandler={() =>
                          handleSectionPreviewPlay(localSectionsArray[absoluteIdx])
                        }
                        size="28px"
                      />
                    ) : null}
                    <EditButton
                      onClickHandler={() =>
                        handleEditSection(localSectionsArray[absoluteIdx])
                      }
                      size="28px"
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SectionsTable;

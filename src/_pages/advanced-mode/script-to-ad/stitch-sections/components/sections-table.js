// src/_pages/advanced-mode/script-to-ad/stitch-sections/components/SectionsTable.js

import React from "react";
import { Table } from "react-bootstrap";
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
        <Table bordered hover style={{ borderColor: "#eb631c" }}>
            <thead style={{ backgroundColor: "#eb631c", color: "white" }}>
                <tr>
                    <th style={{ borderColor: "#eb631c", textAlign: "center" }}>
                        Section ID
                    </th>
                    <th style={{ borderColor: "#eb631c", textAlign: "center" }}>
                        Voice Name
                    </th>
                    <th style={{ borderColor: "#eb631c", textAlign: "center" }}>
                        Section Content
                    </th>
                    <th style={{ borderColor: "#eb631c", textAlign: "center" }}>
                        Duration
                    </th>
                    <th style={{ borderColor: "#eb631c", textAlign: "center" }}>
                        Section End Pause
                    </th>
                    <th style={{ borderColor: "#eb631c", textAlign: "center" }}>
                        Play
                    </th>
                    <th style={{ borderColor: "#eb631c", textAlign: "center" }}>
                        Edit
                    </th>
                </tr>
            </thead>
            <tbody>
                {currentSections.map((section, index) => (
                    <tr key={index}>
                        <td
                            style={{
                                border: "1px solid #eb631c",
                                textAlign: "center",
                                verticalAlign: "middle",
                            }}
                        >
                            {indexOfFirstSection + index + 1}
                        </td>
                        <td
                            style={{
                                border: "1px solid #eb631c",
                                textAlign: "center",
                                verticalAlign: "middle",
                            }}
                        >
                            {section.getVoiceName()}
                        </td>
                        <td
                            style={{
                                border: "1px solid #eb631c",
                                textAlign: "center",
                                verticalAlign: "middle",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                cursor: "pointer",
                            }}
                            onClick={() => handleContentClick(section.getCurrentContent())}
                        >
                            {section.getCurrentContent().length > 30 ? (
                                <>
                                    {`${section.getCurrentContent().substring(0, 30)}`}
                                    <span
                                        style={{
                                            color: "#808080",
                                            fontStyle: "italic",
                                        }}
                                    >
                                        {" "}
                                        ...see more
                                    </span>
                                </>
                            ) : (
                                section.getCurrentContent()
                            )}
                        </td>
                        <td
                            style={{
                                border: "1px solid #eb631c",
                                textAlign: "center",
                                verticalAlign: "middle",
                            }}
                        >
                            {section.getSectionDurationSeconds().toFixed(2)} sec
                        </td>
                        <td
                            style={{
                                border: "1px solid #eb631c",
                                textAlign: "center",
                                verticalAlign: "middle",
                                padding: "0",
                            }}
                        >
                            <div
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "100%",
                                }}
                            >
                                <span style={{ marginRight: "8px" }}>
                                    {section.getEndOfSectionPauseDurationSeconds()} sec
                                </span>
                                <EditButton
                                    onClickHandler={() =>
                                        showEditPauseDurationModal(indexOfFirstSection + index)
                                    }
                                />
                                <EditPauseDurationModal
                                    show={isEditPauseModalVisible}
                                    onHide={() => setEditPauseModalVisible(false)}
                                    initialValue={section.getEndOfSectionPauseDurationSeconds()}
                                    onSave={(newPauseDuration) => {
                                        if (currentEditingSectionIndex !== null) {
                                            updatePauseDuration(
                                                currentEditingSectionIndex,
                                                newPauseDuration
                                            );
                                        }
                                        setEditPauseModalVisible(false);
                                    }}
                                    maxValue={Math.floor(
                                        adLength -
                                        localSectionsArray
                                            .reduce(
                                                (acc, section) =>
                                                    acc +
                                                    section.sectionDurationSeconds +
                                                    section.getEndOfSectionPauseDurationSeconds(),
                                                0
                                            )
                                            .toFixed(2)
                                    )}
                                />
                            </div>
                        </td>
                        <td
                            style={{
                                border: "1px solid #eb631c",
                                textAlign: "center",
                                verticalAlign: "middle",
                            }}
                        >
                            <PlayButton
                                onClickHandler={() =>
                                    handleSectionPreviewPlay(
                                        localSectionsArray[indexOfFirstSection + index]
                                    )
                                }
                                size="28px"
                            />
                        </td>
                        <td
                            style={{
                                border: "1px solid #eb631c",
                                textAlign: "center",
                                verticalAlign: "middle",
                            }}
                        >
                            <EditButton
                                onClickHandler={() =>
                                    handleEditSection(
                                        localSectionsArray[indexOfFirstSection + index]
                                    )
                                }
                                size="28px"
                            />
                        </td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );
};

export default SectionsTable;

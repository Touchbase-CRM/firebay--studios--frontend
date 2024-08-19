import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { Section } from "@/data-structures/section";


const SplitSection = ({ show, onHide, currentSectionContent, currentSectionCharCount, localCurrentSectionObj, localSectionsArray, setLocalSectionsArray, setNumSectionsIdentified, numSectionsIdentified, setTransformedWords, setLocalSectionHistoryObj, processScriptChange, localPushData }) => {
    const [newContent, setNewContent] = useState("");
    const [newSectionContent, setNewSectionContent] = useState("");
    const [displayedContent, setDisplayedContent] = useState(currentSectionContent);
    const [displayedCharCount, setDisplayedCharCount] = useState(currentSectionCharCount);

    // Reset the modal content and displayed content when the modal is opened or closed
    useEffect(() => {
        if (show) {
            setNewContent("");
            setNewSectionContent("");
            setDisplayedContent(currentSectionContent);
            setDisplayedCharCount(currentSectionCharCount);
        }
    }, [show, currentSectionContent, currentSectionCharCount]);

    const handleSave = () => {
        const totalCharCount = newContent.length + newSectionContent.length;
        if (totalCharCount <= displayedCharCount) {
            if (newContent) {
                processScriptChange(newContent);
                localCurrentSectionObj.setHistoryItemId(null); // reset the history item id
                localCurrentSectionObj.setCurrentContent(newContent);
                localCurrentSectionObj.setCurrentWords(newContent.split(" "));
                // Reset the transformations
                localCurrentSectionObj.setCurrentTransformations({});
                setTransformedWords({});
                setLocalSectionHistoryObj(null); // reset the history

                // Create the new section
                const newSectionIndex = localCurrentSectionObj.getIndex() + 1;
                const section = new Section(
                    newSectionIndex,
                    newSectionContent,
                    newSectionContent,
                    null,
                    0
                );
                section.setDragonBreathEnhancement(localCurrentSectionObj.getDragonBreathEnhancement());
                section.setVoiceId(localCurrentSectionObj.getVoiceId());
                section.setVoiceName(localCurrentSectionObj.getVoiceName());
                section.setVoicePreviewFilename(localCurrentSectionObj.getVoicePreviewFilename());
                section.setModelId(localCurrentSectionObj.getModelId());
                section.setVoiceIntonationConsistency(localCurrentSectionObj.getVoiceIntonationConsistency());
                section.setSpeechRate(localCurrentSectionObj.getSpeechRate());

                // Shift the existing sections and insert the new section
                const updatedSections = [...localSectionsArray];
                for (let i = updatedSections.length - 1; i >= newSectionIndex; i--) {
                    updatedSections[i].setIndex(updatedSections[i].getIndex() + 1);
                }
                updatedSections.splice(newSectionIndex, 0, section);

                // Update the state with the new sections array
                setLocalSectionsArray(updatedSections);
                setNumSectionsIdentified(numSectionsIdentified + 1);

                // Add the new section to the navigation stack
                localPushData(
                    `/advanced-mode/script-to-ad/process-section/${localCurrentSectionObj.getIndex() + 1}`
                );
            }
            onHide();
        }
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Split Section</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>Existing Section Content:</p>
                <p>{displayedContent}</p>
                <p>Character Count: {displayedCharCount}</p>
                <Form.Group>
                    <Form.Label>Content for this Section</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                    />
                </Form.Group>
                <Form.Group>
                    <Form.Label>Content for New Section</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        value={newSectionContent}
                        onChange={(e) => setNewSectionContent(e.target.value)}
                    />
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Cancel</Button>
                <Button variant="primary" onClick={handleSave} disabled={newContent.length + newSectionContent.length > displayedCharCount}>Save</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default SplitSection;

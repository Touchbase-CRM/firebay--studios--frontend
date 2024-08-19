import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { Section } from "@/data-structures/section";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FireToggle from '@/components/foundation-components/fire-toggle';
import useUserInputsStore from "@/store/user-inputs";


const SplitSection = ({
    show, onHide, currentSectionContent, currentSectionCharCount, localCurrentSectionObj,
    localSectionsArray, setLocalSectionsArray,
    setTransformedWords, setLocalSectionHistoryObj, processScriptChange, localPushData
}) => {
    const [newContent, setNewContent] = useState("");
    const [newSectionContent, setNewSectionContent] = useState("");
    const [displayedContent, setDisplayedContent] = useState(currentSectionContent);
    const [displayedCharCount, setDisplayedCharCount] = useState(currentSectionCharCount);
    const [totalTypedChars, setTotalTypedChars] = useState(0);
    const {
        s2aAdvancedFreeStyleStatus,
        setS2aAdvancedFreeStyleStatus,
        numSectionsIdentified,
        setNumSectionsIdentified,
    } = useUserInputsStore();
    useEffect(() => {
        if (show) {
            setNewContent("");
            setNewSectionContent("");
            setDisplayedContent(currentSectionContent);
            setDisplayedCharCount(currentSectionCharCount);
            setTotalTypedChars(0);
            setS2aAdvancedFreeStyleStatus(s2aAdvancedFreeStyleStatus);
        }
    }, [show, currentSectionContent, currentSectionCharCount]);

    useEffect(() => {
        setTotalTypedChars(newContent.length + newSectionContent.length);
    }, [newContent, newSectionContent]);

    const handleToggleFreeStyle = (event) => {
        const isToggled = event.target.checked;
        setS2aAdvancedFreeStyleStatus(isToggled);
        if (isToggled) {
            toast.warn("Your spot might go over the intended length");
        }
    };

    const handleSave = () => {
        const totalCharCount = newContent.length + newSectionContent.length;

        if (!s2aAdvancedFreeStyleStatus && totalTypedChars > displayedCharCount) {
            toast.error("The total character count of the new sections must be less than or equal to the original section's character count.");
            return;
        }

        // Proceed if new content for the current section is provided
        if (newContent) {
            processScriptChange(newContent);
            localCurrentSectionObj.setHistoryItemId(null); // reset the history item id
            localCurrentSectionObj.setCurrentContent(newContent);
            localCurrentSectionObj.setCurrentWords(newContent.split(" "));
            // Reset the transformations
            localCurrentSectionObj.setCurrentTransformations({});
            setTransformedWords({});
            setLocalSectionHistoryObj(null); // reset the history

            if (newSectionContent) {
                const newSectionIndex = localCurrentSectionObj.getIndex() + 1;
                const section = new Section(
                    newSectionIndex,
                    newSectionContent,
                    newSectionContent,
                    null,
                    0
                );
                // Copy attributes from the current section
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

                setLocalSectionsArray(updatedSections);
                setNumSectionsIdentified(numSectionsIdentified + 1);
            }

            // Add the new section to the navigation stack
            localPushData(
                `/advanced-mode/script-to-ad/process-section/${localCurrentSectionObj.getIndex() + 1}`
            );

            onHide();  // Close the modal
        } else {
            toast.error("Please enter content for the current section.");
        }
    };


    return (
        <Modal show={show} onHide={onHide}>
            <ToastContainer position="top-center" autoClose={5000} />
            <Modal.Header closeButton>
                <Modal.Title>Split Section</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>Existing Section Content:</p>
                <p>{displayedContent}</p>
                <p>Character Count: {displayedCharCount}</p>
                <p>Typed Character Count: {totalTypedChars} / {displayedCharCount}</p>
                <div className="d-flex align-items-center mb-3">
                    <span className="me-2">Free Style Mode</span>
                    <FireToggle
                        id="free-style-toggle"
                        checked={s2aAdvancedFreeStyleStatus}
                        onChange={handleToggleFreeStyle}
                        color="#eb631c" // Assuming this is the brand color for your toggles
                    />
                </div>
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
                <Button variant="primary" onClick={handleSave}>Save</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default SplitSection;

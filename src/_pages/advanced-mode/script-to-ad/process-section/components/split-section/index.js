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
    const [newContent, setNewContent] = useState(currentSectionContent || "");
    const [newSectionContent, setNewSectionContent] = useState("");
    const [displayedContent, setDisplayedContent] = useState(currentSectionContent);
    const [displayedCharCount, setDisplayedCharCount] = useState(currentSectionCharCount);
    const [totalTypedChars, setTotalTypedChars] = useState(0);
    const [showFullNotes, setShowFullNotes] = useState(false);
    const [limitedNotes, setLimitedNotes] = useState("");

    const {
        s2aAdvancedFreeStyleStatus,
        setS2aAdvancedFreeStyleStatus,
        numSectionsIdentified,
        setNumSectionsIdentified,
    } = useUserInputsStore();

    useEffect(() => {
        if (show) {
            setNewContent(currentSectionContent || "");
            setNewSectionContent("");
            setDisplayedContent(currentSectionContent);
            setDisplayedCharCount(currentSectionCharCount);
            setTotalTypedChars(0);
            setS2aAdvancedFreeStyleStatus(s2aAdvancedFreeStyleStatus);
            updateNotesDisplay();
        }
    }, [show, currentSectionContent, currentSectionCharCount]);

    useEffect(() => {
        setTotalTypedChars(newContent.length + newSectionContent.length);
    }, [newContent, newSectionContent]);

    const updateNotesDisplay = () => {
        const notes = localCurrentSectionObj.getNotes() || "No notes available";
        if (notes.length > 400) {
            setLimitedNotes(notes.substring(0, 400) + "...");
        } else {
            setLimitedNotes(notes);
        }
    };

    const handleToggleFreeStyle = (event) => {
        const isToggled = event.target.checked;
        setS2aAdvancedFreeStyleStatus(isToggled);
        if (isToggled) {
            toast.warn("Your spot might go over the intended length");
        }
    };

    const handleSave = () => {
        if (!s2aAdvancedFreeStyleStatus && totalTypedChars > displayedCharCount) {
            toast.error("The total character count of the new sections must be less than or equal to the original section's character count.");
            return;
        }

        if (!newContent.trim()) {
            toast.error("Please enter content for the current section.");
            return;
        }

        if (!newSectionContent.trim()) {
            toast.error("No content defined for the new section.");
            return;
        }

        processScriptChange(newContent);
        localCurrentSectionObj.setHistoryItemId(null);
        localCurrentSectionObj.setCurrentContent(newContent);
        localCurrentSectionObj.setCurrentWords(newContent.split(" "));
        localCurrentSectionObj.setCurrentTransformations({});
        setTransformedWords({});
        setLocalSectionHistoryObj(null);

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

        const updatedSections = [...localSectionsArray];
        for (let i = updatedSections.length - 1; i >= newSectionIndex; i--) {
            updatedSections[i].setIndex(updatedSections[i].getIndex() + 1);
        }
        updatedSections.splice(newSectionIndex, 0, section);

        setLocalSectionsArray(updatedSections);
        setNumSectionsIdentified(numSectionsIdentified + 1);

        localPushData(`/advanced-mode/script-to-ad/process-section/${localCurrentSectionObj.getIndex() + 1}`);
        onHide();
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" style={{ color: '#333', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
            <ToastContainer position="top-center" autoClose={5000} />
            <Modal.Header closeButton style={{ borderBottom: '1px solid #eb631c' }}>
                <Modal.Title style={{ fontWeight: 'bold', color: '#000000' }}>
                    Split Section {localCurrentSectionObj.getIndex() + 1}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ padding: '20px', backgroundColor: '#ffffff' }}>
                <p style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
                    <strong>Section {localCurrentSectionObj.getIndex() + 1} latest content:</strong>
                    <span style={{ display: 'block', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px', marginTop: '5px' }}>
                        {displayedContent}
                    </span>
                </p>
                <p style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
                    <strong>Section {localCurrentSectionObj.getIndex() + 1} latest character count:</strong> {displayedCharCount}
                </p>
                <p style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
                    <strong>Redistributed character count:</strong> {totalTypedChars} / {displayedCharCount}
                </p>

                <div className="d-flex align-items-center mb-3" style={{ marginBottom: '15px' }}>
                    <span className="me-2" style={{ fontSize: '14px', color: '#666' }}>Free Style Mode</span>
                    <FireToggle
                        id="free-style-toggle"
                        checked={s2aAdvancedFreeStyleStatus}
                        onChange={handleToggleFreeStyle}
                        color="#eb631c"
                    />
                </div>
                <Form.Group style={{ marginBottom: '20px' }}>
                    <Form.Label style={{ fontWeight: 'bold', color: '#666' }}>
                        Updated content for the current section
                    </Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        placeholder={`Enter your content for section ${localCurrentSectionObj.getIndex() + 1}`}
                        style={{ fontSize: '14px', padding: '10px', borderRadius: '4px', borderColor: '#eb631c', backgroundColor: '#f9f9f9' }}
                    />
                </Form.Group>
                <Form.Group>
                    <Form.Label style={{ fontWeight: 'bold', color: '#666' }}>
                        Updated content for the new section
                    </Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        value={newSectionContent}
                        onChange={(e) => setNewSectionContent(e.target.value)}
                        placeholder={`Enter your content for section ${localCurrentSectionObj.getIndex() + 2}`}
                        style={{ fontSize: '14px', padding: '10px', borderRadius: '4px', borderColor: '#eb631c', backgroundColor: '#f9f9f9' }}
                    />
                </Form.Group>

                {/* Display Notes Section */}
                <p style={{ marginBottom: '10px', marginTop: '10px', fontSize: '14px', color: '#666' }}>
                    <strong>Section notes:</strong>
                    <span style={{ display: 'block', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px', marginTop: '5px' }}>
                        {showFullNotes ? localCurrentSectionObj.getNotes() || "No notes available" : limitedNotes}
                        {localCurrentSectionObj.getNotes()?.length > 400 && (
                            <span
                                onClick={() => setShowFullNotes(!showFullNotes)}
                                style={{ color: '#eb631c', cursor: 'pointer', marginLeft: '5px' }}
                            >
                                {showFullNotes ? '...see less' : '...see more'}
                            </span>
                        )}
                    </span>
                </p>
            </Modal.Body>

            <Modal.Footer style={{ borderTop: '1px solid #eb631c', backgroundColor: '#f0f0f0' }}>
                <Button variant="secondary" onClick={onHide} style={{ backgroundColor: '#666', borderColor: '#666', color: '#fff', borderRadius: '4px' }}>Cancel</Button>
                <Button variant="primary" onClick={handleSave} style={{ backgroundColor: '#eb631c', borderColor: '#eb631c', color: '#fff', borderRadius: '4px' }}>Save</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default SplitSection;

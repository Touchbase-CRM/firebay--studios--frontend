import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { Section } from "@/data-structures/section";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SplitSection = ({
    show, onHide, currentSectionContent, currentSectionCharCount, localCurrentSectionObj,
    localSectionsArray, setLocalSectionsArray, setNumSectionsIdentified, numSectionsIdentified,
    setTransformedWords, setLocalSectionHistoryObj, processScriptChange, localPushData, s2aAdvancedFreeStyleStatus
}) => {
    const [newContent, setNewContent] = useState("");
    const [newSectionContent, setNewSectionContent] = useState("");
    const [displayedContent, setDisplayedContent] = useState(currentSectionContent);
    const [displayedCharCount, setDisplayedCharCount] = useState(currentSectionCharCount);
    const [totalTypedChars, setTotalTypedChars] = useState(0);

    // Reset the modal content and displayed content when the modal is opened or closed
    useEffect(() => {
        if (show) {
            setNewContent("");
            setNewSectionContent("");
            setDisplayedContent(currentSectionContent);
            setDisplayedCharCount(currentSectionCharCount);
            setTotalTypedChars(0);
        }
    }, [show, currentSectionContent, currentSectionCharCount]);

    useEffect(() => {
        // Update total typed characters when either content changes
        setTotalTypedChars(newContent.length + newSectionContent.length);
    }, [newContent, newSectionContent]);

    const handleSave = () => {
        if (!s2aAdvancedFreeStyleStatus && totalTypedChars !== displayedCharCount) {
            toast.error("The total character count of the new sections must equal the original section's character count.");
            return;
        }

        if (newContent) {
            processScriptChange(newContent);
            // Proceed with your existing logic...
            onHide();
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
                <Button variant="primary" onClick={handleSave} >Save</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default SplitSection;

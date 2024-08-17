import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";

const SplitSection = ({ show, onHide, currentSectionContent, currentSectionCharCount, onSave }) => {
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
            onSave(newContent, newSectionContent);
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

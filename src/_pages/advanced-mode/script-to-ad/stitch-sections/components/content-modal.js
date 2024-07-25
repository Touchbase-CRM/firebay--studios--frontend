// ContentModal.js

import React from "react";
import { Modal, Button } from "react-bootstrap";

const ContentModal = ({ show, onHide, content }) => {
    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Section Content</Modal.Title>
            </Modal.Header>
            <Modal.Body>{content}</Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Cancel
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ContentModal;

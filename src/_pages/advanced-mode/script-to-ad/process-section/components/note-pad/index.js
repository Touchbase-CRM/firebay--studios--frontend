import React, { useState, useEffect } from "react";
import { Offcanvas, Form, Button } from "react-bootstrap";

function NotePad({ show, handleClose, localCurrentSectionObj, onSaveNotes }) {
    const [notes, setNotes] = useState("");

    useEffect(() => {
        if (localCurrentSectionObj) {
            setNotes(localCurrentSectionObj.getNotes() || "");
        }
    }, [localCurrentSectionObj]);

    const handleSaveNotes = () => {
        localCurrentSectionObj.setNotes(notes);
        onSaveNotes(); // Call the function passed from the parent
        handleClose();
    };

    return (
        <Offcanvas show={show} onHide={handleClose} placement="start" style={{ width: "1000px" }}>
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>Pyro Notepad</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <Form.Group controlId="notesInput">
                    <Form.Label> Notes</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={6}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add your notes here..."
                        style={{ fontSize: "1rem", height: "900px" }}
                    />
                </Form.Group>
                <div className="d-flex justify-content-end mt-3">
                    <Button className="mt-3 me-auto" style={{ backgroundColor: "#EB631C", borderColor: "#EB631C" }} onClick={handleSaveNotes}>

                        Save Notes
                    </Button>
                </div>
            </Offcanvas.Body>
        </Offcanvas>
    );
}

export default NotePad;

// src/components/rename-modal/index.js
import React from "react";
import { Modal, Button, Form } from "react-bootstrap";
import Swal from "sweetalert2";
import {
  getFirestore,
  doc,
  getDocs,
  updateDoc,
  query,
  collection,
  where,
} from "firebase/firestore";
import app from "@/firebase";

const RenameModal = ({
  show,
  onHide,
  newSpotName,
  setNewSpotName,
  spotId,
  setSpotName,
}) => {
  const updateSpotName = async () => {
    if (!newSpotName.trim()) {
      Swal.fire({
        title: "Error!",
        text: "Please enter a valid name for the spot.",
        icon: "error",
      });
      return;
    }
    const db = getFirestore(app);

    try {
      // Query to check if the new spot name already exists
      const spotsRef = collection(db, "spots_meta_data");
      const q = query(spotsRef, where("spotName", "==", newSpotName));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        Swal.fire({
          title: "Duplicate Name",
          text: "This spot name already exists. Please choose a different name.",
          icon: "error",
        });
        return;
      }

      // Perform the update operations
      const spotRef = doc(db, "spots_meta_data", spotId);
      const adRef = doc(db, "ads", spotId);

      await updateDoc(spotRef, { spotName: newSpotName });
      await updateDoc(adRef, { "sharedStates.spotName": newSpotName });

      Swal.fire({
        title: "Success",
        text: "Spot name updated successfully.",
        icon: "success",
      });

      // Optionally, you can update the state or perform other actions here
      setSpotName(newSpotName);
      onHide();
    } catch (error) {
      console.error("Failed to update spot name:", error);
      Swal.fire({
        title: "Update Failed",
        text: error.message,
        icon: "error",
      });
    }
  };

  return (
    // Note for future developers:
    // We are using a standard Bootstrap Modal here instead of the GenericModal due to persistent styling issues with GenericModal.
    // The GenericModal does not apply the custom styles correctly in this context, hence we have resorted to using Bootstrap Modal with the same color scheme.
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header
        closeButton
        style={{
          backgroundColor: "#f8f9fa",
          borderBottom: "1px solid #dee2e6",
        }}
      >
        <Modal.Title style={{ color: "#495057", fontWeight: "500" }}>
          Edit Spot Name
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group controlId="editSpotName">
          <Form.Label>Spot Name</Form.Label>
          <Form.Control
            type="text"
            value={newSpotName}
            onChange={(e) => setNewSpotName(e.target.value)}
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer
        style={{ backgroundColor: "#f8f9fa", borderTop: "1px solid #dee2e6" }}
      >
        <Button
          variant="secondary"
          onClick={onHide}
          style={{
            fontWeight: "400",
            backgroundColor: "#FDA942",
            borderColor: "#FDA942",
          }}
        >
          Close
        </Button>
        <Button
          onClick={updateSpotName}
          style={{
            fontWeight: "400",
            backgroundColor: "#eb631c",
            borderColor: "#eb631c",
          }}
        >
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RenameModal;

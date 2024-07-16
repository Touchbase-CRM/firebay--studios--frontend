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
import { getAuth } from "firebase/auth";
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
    const auth = getAuth(app);
    const currentUser = auth.currentUser;

    try {
      // Query to check if the new spot name already exists for other users
      const spotsRef = collection(db, "spots_meta_data");
      const q = query(spotsRef, where("spotName", "==", newSpotName));
      const querySnapshot = await getDocs(q);

      // Manually filter the documents to exclude the current user's documents
      const filteredDocs = querySnapshot.docs.filter(
        (doc) => doc.data().userId === currentUser.uid
      );

      const isDuplicate = filteredDocs.length > 0;

      if (isDuplicate) {
        Swal.fire({
          title: "Duplicate Name",
          text: `This spot name already exists. Please choose a different name.`,
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
      Swal.fire({
        title: "Update Failed",
        text: error.message,
        icon: "error",
      });
    }
  };

  return (
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
            maxLength={30} // Limiting input to 30 characters
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

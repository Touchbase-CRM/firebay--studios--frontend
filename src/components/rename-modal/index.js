import React from "react";
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
import { getAuth } from "@/firebase";
import app from "@/firebase";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";

const RenameModal = ({ show, onHide, newSpotName, setNewSpotName, spotId, setSpotName }) => {
  const updateSpotName = async () => {
    if (!newSpotName.trim()) {
      Swal.fire({ title: "Error", text: "Please enter a valid name for the spot.", icon: "error" });
      return;
    }
    const db = getFirestore(app);
    const auth = getAuth(app);
    const currentUser = auth.currentUser;
    try {
      const spotsRef = collection(db, "spots_meta_data");
      const q = query(spotsRef, where("spotName", "==", newSpotName));
      const snap = await getDocs(q);
      const dupes = snap.docs.filter((d) => d.data().userId === currentUser.uid);
      if (dupes.length > 0) {
        Swal.fire({
          title: "Duplicate name",
          text: "A spot with this name already exists.",
          icon: "error",
        });
        return;
      }

      const spotRef = doc(db, "spots_meta_data", spotId);
      const adRef = doc(db, "ads", spotId);
      await updateDoc(spotRef, { spotName: newSpotName });
      await updateDoc(adRef, { "sharedStates.spotName": newSpotName });
      setSpotName(newSpotName);
      onHide();
    } catch (error) {
      Swal.fire({ title: "Update failed", text: error.message, icon: "error" });
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      title="Edit spot name"
      primaryAction={{ label: "Save", onClick: updateSpotName }}
      secondaryAction={{ label: "Cancel", onClick: onHide }}
    >
      <Input
        autoFocus
        label="Spot name"
        value={newSpotName}
        onChange={(e) => setNewSpotName(e.target.value)}
        maxLength={30}
        onKeyDown={(e) => {
          if (e.key === "Enter") updateSpotName();
        }}
      />
    </Modal>
  );
};

export default RenameModal;

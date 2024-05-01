import { Button, Table, Container, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { GenericModal } from "@/components/foundationComponents/modal";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Swal from "sweetalert2";
import useUserInputsStore from "../store/userInputs";
import { deserializeAndLoadModeData } from "@/utils/dbReadWriteOps/deserializationUtils";
import { Section } from "../dataStructures/section";
import { getAuth } from "firebase/auth";

import app from "../firebase";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  setDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

const Dashboard = () => {
  const [showCreateAdModal, setShowCreateAdModal] = useState(false);
  const [spots, setSpots] = useState([]);
  const [adName, setAdName] = useState("");
  const [currentTableIndex, setCurrentTableIndex] = useState(0);
  const [paginatedSpots, setPaginatedSpots] = useState([]);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newSpotName, setNewSpotName] = useState("");
  const [selectedSpotId, setSelectedSpotId] = useState("");
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [newCopySpotName, setNewCopySpotName] = useState("");
  const [copySpotId, setCopySpotId] = useState("");
  const router = useRouter();
  const auth = getAuth(app);
  const currentUser = auth.currentUser;
  const db = getFirestore(app);
  const pageSize = 6;

  const {
    // shared states
    setOgScriptWordsArray,
    setOriginalScriptString,
    setTransformedWords,
    setVoiceId,
    setVoiceName,
    setVoicePreviewFilename,
    setAdLength,
    setChosenMusic,
    setMusicVol,
    setPreviewFileName,
    setBackgroundMusicFilename,
    setGeneratedVoiceUrl,
    setModelId,
    setAdGenerationMethod,
    setSpotId,
    spotId,
    // advanced script to ad states
    setNavigationStack,
    setSectionsArray,
    setNumSectionsIdentified,
    setSectionHistoryArray,
    setStitchedAudioPyroHistoryItemId,
    reset: resetUserInputsStore,
  } = useUserInputsStore();

  useEffect(() => {
    // Slice the spots array to get only the current page items
    setPaginatedSpots(
      spots.slice(currentTableIndex, currentTableIndex + pageSize)
    );
  }, [spots, currentTableIndex]);

  useEffect(() => {
    if (!currentUser) {
      console.log("No user logged in");
      return;
    }

    const fetchSpots = async () => {
      try {
        const spotsQuery = query(
          collection(db, "spots_meta_data"),
          where("userId", "==", currentUser.uid)
        );
        const querySnapshot = await getDocs(spotsQuery);
        const fetchedSpots = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            spotName: data.spotName || "-", // Show '-' if spotName is null or undefined
            created: data.created
              ? data.created.toDate().toLocaleString()
              : "-", // Show '-' if created date is null
            lastDownloaded: data.lastDownloaded
              ? data.lastDownloaded.toDate().toLocaleString()
              : "Never", // Show 'Never' if lastDownloaded is null
          };
        });
        setSpots(fetchedSpots);
      } catch (error) {
        console.error("Error fetching spots:", error);
        Swal.fire({
          title: "Error fetching spots!",
          text: error.message,
          icon: "error",
        });
      }
    };

    fetchSpots();
  }, [currentUser]);

  const handleCloseModal = () => {
    setShowCreateAdModal(false);
    setAdName("");
  };

  const handleAdNameChange = (event) => {
    setAdName(event.target.value);
  };

  const handleNextOnCreateAd = () => {
    if (!adName.trim()) {
      Swal.fire({
        title: "Error!",
        text: "Please enter a name for the Spot.",
        icon: "error",
      });
      return;
    }
    router.push({
      pathname: "/home",
      query: { spotName: adName },
    });
  };

  const deserializeSectionsArray = async (serializedSections) => {
    const sections = await Promise.all(
      serializedSections.map(async (serializedSection) => {
        const section = Section.deserialize(serializedSection);
        await section.updateAudioUrl(0, 3); // Assuming you pass 0 for estimatedProcessingTime and 3 for maxRetries
        return section;
      })
    );
    return sections;
  };

  const deserializeSectionHistoryArray = async (sectionHistoryArray) => {
    const updatedSectionHistoryArray = await Promise.all(
      sectionHistoryArray.map(async (section) => {
        const transformedSection = new Map();
        for (const key in section) {
          const deserializedSection = Section.deserialize(section[key]);
          await deserializedSection.updateAudioUrl(0, 3); // Using default values for demonstration
          transformedSection.set(key, deserializedSection);
        }
        return transformedSection;
      })
    );
    return updatedSectionHistoryArray;
  };

  function updateState(data) {
    return new Promise(async (resolve) => {
      // Synchronous state updates
      setOgScriptWordsArray(data.sharedStates.ogScriptWordsArray);
      setOriginalScriptString(data.sharedStates.originalScriptString);
      setTransformedWords(data.sharedStates.transformedWords);
      setVoiceId(data.sharedStates.voiceId);
      setVoiceName(data.sharedStates.voiceName);
      setVoicePreviewFilename(data.sharedStates.voicePreviewFilename);
      setAdLength(data.sharedStates.adLength);
      setChosenMusic(data.sharedStates.chosenMusic);
      setMusicVol(data.sharedStates.musicVol);
      setPreviewFileName(data.sharedStates.previewFileName);
      setBackgroundMusicFilename(data.sharedStates.backgroundMusicFilename);
      setGeneratedVoiceUrl(data.sharedStates.generatedVoiceUrl);
      setModelId(data.sharedStates.modelId);
      setAdGenerationMethod(data.sharedStates.adGenerationMethod);
      setSpotId(data.sharedStates.spotId);
      setNumSectionsIdentified(
        data.featureSpecificStates.numSectionsIdentified
      );
      setStitchedAudioPyroHistoryItemId(
        data.featureSpecificStates.stitchedAudioPyroHistoryItemId
      );

      // Asynchronous state updates
      try {
        const tmparr = await deserializeSectionsArray(
          data.featureSpecificStates.sectionsArray
        );
        setSectionsArray(tmparr);
        const tmpHistoryArray = await deserializeSectionHistoryArray(
          data.featureSpecificStates.sectionHistoryArray
        );
        setSectionHistoryArray(tmpHistoryArray);
        resolve(); // Resolve the promise after all async updates are done
      } catch (error) {
        console.error("Error updating state:", error);
        resolve(); // Resolve the promise also on error to not hang the promise
      }
    });
  }

  async function handleEditSpot(spotId) {
    try {
      const data = await deserializeAndLoadModeData({ spotId });
      await updateState(data); // Wait for all state updates to complete
      router.push("/advanced-mode/script-to-ad/process-section/0");
    } catch (error) {
      console.error("Failed to fetch or update state:", error);
    }
  }

  const handleCreateAd = () => {
    setShowCreateAdModal(true);
  };
  const handleDownloadClick = () => {
    console.log("Download button clicked");
  };

  const handleCopyClick = (spotId) => {
    setCopySpotId(spotId);
    setShowCopyModal(true);
  };

  const handleSaveCopy = async () => {
    if (!newCopySpotName.trim()) {
      Swal.fire("Error", "Please enter a valid name for the copy.", "error");
      return;
    }

    if (!copySpotId) {
      console.error("Copy operation failed: No spot ID provided.");
      Swal.fire(
        "Error",
        "No spot ID provided for the copy operation.",
        "error"
      );
      return;
    }

    try {
      // Get references to the original documents
      const spotRef = doc(db, "spots_meta_data", copySpotId);
      const adRef = doc(db, "ads", copySpotId);

      // Fetch the documents
      const spotSnap = await getDoc(spotRef);
      const adSnap = await getDoc(adRef);

      if (!spotSnap.exists() || !adSnap.exists()) {
        Swal.fire("Error", "Original spot data not found.", "error");
        return;
      }

      // Get current timestamp
      const now = new Date();

      // Create a new document in 'spots_meta_data', which automatically generates a new ID
      const newSpotMetaRef = doc(collection(db, "spots_meta_data"));
      await setDoc(newSpotMetaRef, {
        ...spotSnap.data(),
        spotName: newCopySpotName,
        created: now,
        lastDownloaded: null,
      });

      // Use the same ID for the 'ads' document
      const newAdRef = doc(db, "ads", newSpotMetaRef.id);
      await setDoc(newAdRef, {
        ...adSnap.data(),
        spotName: newCopySpotName,
      });

      // Update the local spots array
      const newSpot = {
        id: newSpotMetaRef.id,
        spotName: newCopySpotName,
        created: now.toLocaleString(),
        lastDownloaded: "Never", // You can also decide to display something else or leave it blank
      };

      setSpots([...spots, newSpot]);
      setPaginatedSpots(
        [...spots, newSpot].slice(
          currentTableIndex,
          currentTableIndex + pageSize
        )
      );
      setShowCopyModal(false); // Close the modal after successful copy
      Swal.fire("Success", "Spot copied successfully!", "success");
    } catch (error) {
      console.error("Copy failed:", error);
      Swal.fire("Failed to copy spot", error.message, "error");
    }
  };

  const handleRenameSpot = (spotId) => {
    setSelectedSpotId(spotId); // Save the selected spot's ID for updating
    setShowRenameModal(true); // Show the rename modal
  };

  const updateSpotName = async () => {
    if (!newSpotName.trim()) {
      Swal.fire({
        title: "Error!",
        text: "Please enter a valid name for the spot.",
        icon: "error",
      });
      return;
    }

    if (!selectedSpotId || typeof selectedSpotId !== "string") {
      console.error("Invalid spot ID:", selectedSpotId); // Log the invalid ID
      Swal.fire({
        title: "Error",
        text: "No valid spot selected for renaming.",
        icon: "error",
      });
      return;
    }

    try {
      const spotRef = doc(db, "spots_meta_data", selectedSpotId);
      const adRef = doc(db, "ads", selectedSpotId);

      await updateDoc(spotRef, { spotName: newSpotName });
      await updateDoc(adRef, { spotName: newSpotName });

      const updatedSpots = spots.map((spot) =>
        spot.id === selectedSpotId ? { ...spot, spotName: newSpotName } : spot
      );
      setSpots(updatedSpots);
      setShowRenameModal(false); // Close the modal after update
    } catch (error) {
      console.error("Failed to update spot name:", error);
      Swal.fire({
        title: "Update Failed",
        text: error.message,
        icon: "error",
      });
    }
  };

  const handleCloseRenameModal = () => {
    setShowRenameModal(false);
    setNewSpotName(""); // Reset the input field
  };

  const handleNextTableContent = () => {
    // Check if we have more spots to show
    if (currentTableIndex + pageSize < spots.length) {
      setCurrentTableIndex(currentTableIndex + pageSize);
    }
  };

  const handlePreviousTableContent = () => {
    // Check if we aren't at the beginning
    if (currentTableIndex - pageSize >= 0) {
      setCurrentTableIndex(currentTableIndex - pageSize);
    }
  };
  const handleDeleteSpot = async (spotId) => {
    try {
      const confirmation = await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
      });

      if (confirmation.isConfirmed) {
        // Reference to the documents in Firestore
        const spotRef = doc(db, "spots", spotId);
        const spotMetaRef = doc(db, "spots_meta_data", spotId);
        const adsRef = doc(db, "ads", spotId);

        // Delete documents from Firestore
        await deleteDoc(spotRef);
        await deleteDoc(spotMetaRef);
        await deleteDoc(adsRef);

        // Update local state to remove the deleted spot
        const updatedSpots = spots.filter((spot) => spot.id !== spotId);
        setSpots(updatedSpots);

        Swal.fire(
          "Deleted!",
          "The spot and its associated data have been deleted.",
          "success"
        );
      }
    } catch (error) {
      console.error("Failed to delete spot and associated data:", error);
      Swal.fire({
        title: "Deletion Failed",
        text: error.message,
        icon: "error",
      });
    }
  };

  return (
    <Container
      fluid
      style={{
        backgroundColor: "white",
        padding: "20px",
        minHeight: "100vh",
      }}
    >
      <Row
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "1rem",
        }}
      >
        <Col xs={12}>
          <Button
            variant="warning"
            style={{
              backgroundColor: "#eb631c",
              borderColor: "#eb631c",
              color: "white",
              alignSelf: "flex-start",
            }}
            onClick={handleCreateAd}
          >
            Create a new Spot
          </Button>
        </Col>
      </Row>

      <Row>
        <Col xs={12}>
          <Table striped bordered hover>
            <thead
              style={{
                backgroundColor: "#e4e4e4",
              }}
            >
              <tr>
                <th>Spot Name</th>
                <th>Created</th>
                <th>Last Downloaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSpots.map((spot, index) => (
                <tr key={index}>
                  <td>{spot.spotName || "-"}</td>
                  <td>{spot.created || "-"}</td>
                  <td>{spot.lastDownloaded || "Never"}</td>
                  <td>
                    <Button
                      variant="link"
                      onClick={handleDownloadClick}
                      title="Download Spot"
                    >
                      <i
                        className="bi bi-download"
                        style={{ color: "black" }}
                      ></i>
                    </Button>
                    <Button
                      variant="link"
                      onClick={() => handleCopyClick(spot.id)} // Pass the spot.id correctly
                      title="Duplicate Spot"
                    >
                      <i className="bi bi-files" style={{ color: "black" }}></i>
                    </Button>
                    <Button
                      variant="link"
                      onClick={() => handleRenameSpot(spot.id)}
                      title="Rename Spot"
                    >
                      <i
                        className="bi bi-input-cursor-text"
                        style={{ color: "black" }}
                      ></i>
                    </Button>
                    <Button
                      variant="link"
                      onClick={() => handleEditSpot(spot.id)}
                      title="Edit Spot"
                    >
                      <i
                        className="bi bi-pencil-square"
                        style={{ color: "black" }}
                      ></i>
                    </Button>
                    <Button
                      variant="link"
                      onClick={() => handleDeleteSpot(spot.id)}
                      title="Delete Spot"
                    >
                      <i
                        className="bi bi-trash-fill"
                        style={{ color: "red" }}
                      ></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>

      <Row>
        <Col xs={12} className="text-right">
          <div style={{ marginTop: "20px" }}>
            <Button
              variant="outline-secondary"
              onClick={handlePreviousTableContent}
              disabled={currentTableIndex === 0}
            >
              {"<"}
            </Button>{" "}
            <Button
              variant="outline-secondary"
              onClick={handleNextTableContent}
              disabled={currentTableIndex + pageSize >= spots.length}
            >
              {">"}
            </Button>
          </div>
        </Col>
      </Row>
      <GenericModal
        show={showCopyModal}
        onHide={() => setShowCopyModal(false)}
        title="Copy Spot"
        onSave={handleSaveCopy}
        closeButtonLabel="Cancel"
        saveButtonLabel="Copy"
      >
        <input
          type="text"
          value={newCopySpotName}
          onChange={(e) => setNewCopySpotName(e.target.value)}
          className="form-control"
          placeholder="Enter the new Spot name"
        />
      </GenericModal>

      <GenericModal
        show={showRenameModal}
        onHide={handleCloseRenameModal}
        title="Rename Spot"
        onSave={updateSpotName}
        closeButtonLabel="Cancel"
        saveButtonLabel="Save"
      >
        <input
          type="text"
          value={newSpotName}
          onChange={(e) => setNewSpotName(e.target.value)}
          className="form-control"
          placeholder="Enter the new Spot name"
        />
      </GenericModal>

      <GenericModal
        show={showCreateAdModal}
        onHide={handleCloseModal}
        title="Enter Spot Name"
        onSave={handleNextOnCreateAd}
        closeButtonLabel="Discard"
        saveButtonLabel="Next"
      >
        <input
          type="text"
          value={adName}
          onChange={handleAdNameChange}
          className="form-control"
          placeholder="Type the Spot name here"
        />
      </GenericModal>
    </Container>
  );
};

export default Dashboard;

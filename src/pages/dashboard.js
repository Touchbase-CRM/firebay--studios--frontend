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
  doc,
  updateDoc,
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

  const deserializeSectionsArray = (serializedSections) => {
    return serializedSections.map((serializedSection) =>
      Section.deserialize(serializedSection)
    );
  };

  const deserializeSectionHistoryArray = (sectionHistoryArray) => {
    return sectionHistoryArray.map((section) => {
      const transformedSection = new Map();
      for (const key in section) {
        transformedSection.set(key, Section.deserialize(section[key]));
      }
      return transformedSection;
    });
  };

  async function updateState(data) {
    return new Promise((resolve) => {
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
      // Include all other set operations
      const tmparr = deserializeSectionsArray(
        data.featureSpecificStates.sectionsArray
      );
      setSectionsArray(tmparr);
      const tmpHistoryArray = deserializeSectionHistoryArray(
        data.featureSpecificStates.sectionHistoryArray
      );
      setSectionHistoryArray(tmpHistoryArray);
      resolve();
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

  const handleDeleteClick = () => {
    console.log("Delete button clicked");
  };

  const handleCopyClick = () => {
    console.log("Copy action initiated");
  };

  const handleRenameClick = (spotId) => {
    console.log("Selected spot ID for renaming:", spotId); // Log the spot ID to check its value
    setSelectedSpotId(spotId); // Save the selected spot's ID for updating
    setShowRenameModal(true); // Show the rename modal
  };

  const handleRenameSpot = async () => {
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

      console.log(
        "Updating spot and ad references with new name:",
        newSpotName
      ); // Log update attempt
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
                      onClick={handleCopyClick}
                      title="Duplicate Spot"
                    >
                      <i className="bi bi-files" style={{ color: "black" }}></i>
                    </Button>
                    <Button
                      variant="link"
                      onClick={() => handleRenameClick(spot.id)}
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
                      onClick={handleDeleteClick}
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
        show={showRenameModal}
        onHide={handleCloseRenameModal}
        title="Rename Spot"
        onSave={handleRenameSpot}
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

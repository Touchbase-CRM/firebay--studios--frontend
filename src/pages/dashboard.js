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
} from "firebase/firestore";

const Dashboard = () => {
  const [showCreateAdModal, setShowCreateAdModal] = useState(false);
  const [spots, setSpots] = useState([]);
  const [adName, setAdName] = useState("");
  const router = useRouter();
  const auth = getAuth(app);
  const currentUser = auth.currentUser;
  const db = getFirestore(app);

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
    const fetchSpots = async () => {
      try {
        const spotsQuery = query(
          collection(db, "spots_meta_data"),
          where("userId", "==", currentUser.uid) // Replace 'CURRENT_USER_ID' with actual current user ID
          // orderBy("created", "desc"),
          // limit(6)
        );
        const querySnapshot = await getDocs(spotsQuery);
        const fetchedSpots = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("fetchedSpots", fetchedSpots);
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
  }, []);

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
      console.log("All state updates completed for spot:", spotId);
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

  const handleRenameClick = () => {
    console.log("Rename action initiated");
  };
  const handlePreviousTableContent = () => {
    console.log("Previous table content action initiated");
  };
  const handleNextTableContent = () => {
    console.log("Next table content action initiated");
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
              {spots.map((spot, index) => (
                <tr key={index}>
                  <td>{spot.spotName}</td>
                  <td>{new Date(spot.created).toLocaleString()}</td>
                  <td>{new Date(spot.lastDownloaded).toLocaleString()}</td>
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
                      onClick={handleRenameClick}
                      title="Rename Spot"
                    >
                      <i
                        className="bi bi-input-cursor-text"
                        style={{ color: "black" }}
                      ></i>
                    </Button>
                    <Button
                      variant="link"
                      onClick={() => handleEditSpot(spot.id)} // Correctly passing the function as a closure
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
            >
              {"<"}
            </Button>{" "}
            <Button
              variant="outline-secondary"
              onClick={handleNextTableContent}
            >
              {">"}
            </Button>
          </div>
        </Col>
      </Row>
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

import { Button, Table, Container, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { GenericModal } from "@/components/foundationComponents/modal";
import React, { useState } from "react";
import { useRouter } from "next/router";
import Swal from "sweetalert2";
import useUserInputsStore from "../store/userInputs";
import { deserializeAndLoadModeData } from "@/utils/dbReadWriteOps/deserializationUtils";
import { Section } from "../dataStructures/section";

const Dashboard = () => {
  const [showCreateAdModal, setShowCreateAdModal] = useState(false);
  const [adName, setAdName] = useState("");
  const router = useRouter();

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
      setOgScriptWordsArray(data.featureSpecificStates.ogScriptWordsArray);
      setOriginalScriptString(data.featureSpecificStates.originalScriptString);
      // Include all other set operations
      const tmparr = deserializeSectionsArray(
        data.featureSpecificStates.sectionsArray
      );
      console.log("tmparr is ", tmparr);
      setSectionsArray(tmparr);
      const tmpHistoryArray = deserializeSectionHistoryArray(
        data.featureSpecificStates.sectionHistoryArray
      );
      console.log("tmpHistoryArray is ", tmpHistoryArray);
      setSectionHistoryArray(tmpHistoryArray);
      resolve();
    });
  }

  async function handleEditSpot() {
    const spotId = "K8ZCWdvRYBrx5yseZFDm"; // Hardcoded for development

    try {
      const data = await deserializeAndLoadModeData({ spotId });
      await updateState(data); // Wait for all state updates to complete
      console.log("All state updates completed");
    } catch (error) {
      console.error("Failed to fetch or update state:", error);
    }

    setTimeout(() => {
      console.log("Redirecting...");
      router.push("/advanced-mode/script-to-ad/process-section/0");
    }, 10000); // Adjust the timing if necessary
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
              {Array.from({ length: 6 }).map((_, index) => (
                <tr key={index}>
                  <td>Lorem ipsum dolor sit amet, consecte...</td>
                  <td>Nov 3, 2023, 11:32AM</td>
                  <td>Nov 5, 2023, 10:32AM</td>
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
                      onClick={handleEditSpot}
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

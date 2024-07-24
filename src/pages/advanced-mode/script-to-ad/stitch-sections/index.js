import React, { useState, useEffect, useRef } from "react";
import { getAuth } from "firebase/auth";
import { useRouter } from "next/router";
import axios from "axios";
import Swal from "sweetalert2";
import _ from "lodash";

import { usePostHog } from "posthog-js/react";
import { Card, Button, Table, Modal } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

import RenameModal from "@/components/rename-modal";
import SimpleAudioPlayer from "@/components/simple-audio-player";
import { NavBar } from "@/components/foundation-components/nav-bar";
import Spinner from "@/components/spinner/spinner";
import { PlayButton } from "@/components/buttons/play-button/play";
import { EditButton } from "@/components/buttons/edit-button/edit";
import { SecondaryActionButton } from "@/components/buttons/secondary-action-button";

import withAuth from "@/hocs/with-auth";
import { Stack } from "@/data-structures/stack";

import useUserInputsStore from "@/store/user-inputs";

import {
  fetchAudioFromPyroBackendDistribution,
  fetchAudioFromElevenLabs,
} from "@/utils/fetch-audio/fetch-from-distribution";
import {
  updateExistingSpotInDb,
  writeToFirestore,
} from "@/utils/db-read-write-ops/serialization-utils";

import { EditPauseDurationModal } from "@/_pages/advanced-mode/script-to-ad/stitch-sections/components/edit-pause-duration-modal/modal";

function StitchSections() {
  const auth = getAuth();
  const router = useRouter();
  const posthog = usePostHog();

  const {
    spotName,
    setSpotName,
    sectionsArray,
    setSectionsArray,
    adLength,
    reset: resetUserInputsStore,
    generatedVoiceUrl,
    setGeneratedVoiceUrl,
    setStitchedAudioPyroHistoryItemId,
    stitchedAudioPyroHistoryItemId,
    spotId,
  } = useUserInputsStore();

  const saveFeatureSpecificStates = {
    sectionsArray,
    stitchedAudioPyroHistoryItemId,
  };

  const saveSharedStates = {
    spotId,
    adLength,
    generatedVoiceUrl,
  };

  const [localStack, setLocalStack] = useState(() => new Stack());
  const syncStackWithGlobal = useUserInputsStore(
    (state) => state.setNavigationStack
  );
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newSpotName, setNewSpotName] = useState("");
  const [isEditPauseModalVisible, setEditPauseModalVisible] = useState(false);
  const [currentEditingSectionIndex, setCurrentEditingSectionIndex] =
    useState(null);

  const [audioUrl, setAudioUrl] = useState("");
  const [audioTitle, setAudioTitle] = useState("");
  const [selectedSection, setSelectedSection] = useState(null);
  const [pendingAdvertisement, setPendingAdvertisement] = useState(false);
  const [combinedVoiceoverUrl, setCombinedVoiceoverUrl] = useState(null);
  const [nowPlayingUrl, setNowPlayingUrl] = useState("");
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [forceRenderKey, setForceRenderKey] = useState(0);
  const [localSectionsArray, setLocalSectionsArray] = useState(sectionsArray);
  const [showContentModal, setShowContentModal] = useState(false);
  const [contentModalText, setContentModalText] = useState("");

  const musicGenWebServiceUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:8000"
      : "https://vgz580uujk.execute-api.us-east-2.amazonaws.com";

  const cancelTokenSourceRef = useRef(null);

  useEffect(() => {
    calculateTotalDuration();
  }, [localSectionsArray]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    const handleBackButton = async () => {
      handleLogout();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.onpopstate = handleBackButton;

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.onpopstate = null;
    };
  }, [router]);

  const calculateTotalDuration = () => {
    const totalDurationWithoutPauses = localSectionsArray.reduce(
      (acc, section) => acc + section.sectionDurationSeconds,
      0
    );

    const totalDurationWithPauses = localSectionsArray.reduce(
      (acc, section) =>
        acc +
        section.sectionDurationSeconds +
        section.getEndOfSectionPauseDurationSeconds(),
      0
    );

    return {
      totalDurationWithoutPauses,
      totalDurationWithPauses,
    };
  };

  const showEditPauseDurationModal = (sectionIndex) => {
    setCurrentEditingSectionIndex(sectionIndex);
    setEditPauseModalVisible(true);
  };

  const updatePauseDuration = (index, newDuration) => {
    let newArray = [...localSectionsArray];
    let sectionToUpdate = newArray[index];

    const validDuration =
      isNaN(parseFloat(newDuration)) || newDuration === ""
        ? 0
        : parseFloat(newDuration);
    sectionToUpdate.setEndOfSectionPauseDurationSeconds(validDuration);

    const totalDurationWithPauses = newArray.reduce(
      (acc, section) =>
        acc +
        section.sectionDurationSeconds +
        section.getEndOfSectionPauseDurationSeconds(),
      0
    );

    if (totalDurationWithPauses > adLength) {
      Swal.fire({
        title: "Exceeded Ad Length",
        text: `Added pause will exceed your overall ad length, so it is reverted to 0 seconds.`,
        icon: "warning",
        confirmButtonText: "Ok",
      });

      sectionToUpdate.setEndOfSectionPauseDurationSeconds(0);
    }

    setLocalSectionsArray(newArray);
  };

  const fetchAudioFromElevenLabsWrapper = async (historyItemId) => {
    const audioUrl = await fetchAudioFromElevenLabs(historyItemId);
    setShowAudioPlayer(true);
    setAudioUrl(audioUrl);
    setNowPlayingUrl(audioUrl);
  };

  const handleSaveState = () => {
    updateExistingSpotInDb({
      spotId: spotId,
      mode: "advanced-script-to-ad",
      modeSpecificStates: saveFeatureSpecificStates,
      sharedStates: saveSharedStates,
    });
  };

  const handleNext = (e) => {
    e.preventDefault();
    setGeneratedVoiceUrl(combinedVoiceoverUrl);
    handleSaveState();
    router.push("/add-music");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPendingAdvertisement(true);

    const userId = auth.currentUser ? auth.currentUser.uid : "anonymous";

    if (process.env.NODE_ENV !== "development") {
      posthog.capture("stitch-sections-finalize-voiceover-button-clicked", {
        userId: userId,
        userEmail: auth.currentUser ? auth.currentUser.email : "anonymous",
        script: sectionsArray
          .map((section) => section.getCurrentContent())
          .join(". "),
      });
    }
    cancelTokenSourceRef.current = axios.CancelToken.source();

    const historyItemIds = sectionsArray.map((section) =>
      section.getHistoryItemId()
    );
    const endOfSectionsPausesArray = localSectionsArray.map((section) =>
      section.getEndOfSectionPauseDurationSeconds()
    );
    const payload = {
      user_id: userId,
      history_item_id_list: historyItemIds,
      end_of_section_pause_duration_list: endOfSectionsPausesArray,
    };
    const url = `${musicGenWebServiceUrl}/stitch-sections`;
    try {
      const response = await axios.post(url, payload, {
        cancelToken: cancelTokenSourceRef.current.token,
      });
      if (response.data.pyro_history_item_id) {
        const pyroHistoryItemId = response.data.pyro_history_item_id;
        if (!pyroHistoryItemId) {
          throw new Error("Failed to preprocess voiceover");
        }

        const audioUrl = await fetchAudioFromPyroBackendDistribution(
          pyroHistoryItemId,
          0
        );
        setShowAudioPlayer(true);
        setCombinedVoiceoverUrl(audioUrl);
        setNowPlayingUrl(audioUrl);
        setAudioTitle("Final Cut");
        setForceRenderKey(Math.random().toString());
        setStitchedAudioPyroHistoryItemId(pyroHistoryItemId);
      } else if (response.data.error) {
        console.error(
          "API returned an error:",
          response.data.error,
          response.data.details ? response.data.details : ""
        );
      }
    } catch (error) {
      console.error("Error fetching pyro_history_item_id:", error);
    } finally {
      setPendingAdvertisement(false);
    }
    setSectionsArray(localSectionsArray);
    await writeToFirestore(
      "spots_meta_data",
      { historyItemId: stitchedAudioPyroHistoryItemId },
      spotId
    )
      .then(() => console.log("History item ID saved successfully."))
      .catch((error) => console.error("Error saving document.:", error));
  };

  const cancelLoading = () => {
    setPendingAdvertisement(false);
    if (cancelTokenSourceRef.current) {
      cancelTokenSourceRef.current.cancel("Request canceled by the user.");
    }
    Swal.fire({
      icon: "info",
      title: "Submission Cancelled",
      text: 'Your submission has been cancelled. Click "OK" to redirect to the Home page...',
      showConfirmButton: true,
      confirmButtonText: "OK",
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        resetUserInputsStore();

        router.push("/home");
      }
    });
  };

  const cancelAndRetryLoading = () => {
    if (cancelTokenSourceRef.current) {
      cancelTokenSourceRef.current.cancel(
        "Request canceled by the user for retry."
      );
    }

    Swal.fire({
      icon: "info",
      title: "Submission Cancelled",
      text: "Your previous submission has been cancelled. You can retry submitting again if you wish.",
      confirmButtonText: "OK",
      allowOutsideClick: false,
    });
  };

  const handleLogout = () => {
    resetUserInputsStore();
    localStorage.removeItem("user");
    auth
      .signOut()
      .then(() => {
        router.push("/login");
      })
      .catch((error) => {
        console.error("Logout Error:", error);
      });
  };

  const handleSectionPreviewPlay = async (section) => {
    let historyItemId = "";
    setSelectedSection(section);
    setAudioTitle(`Section ${section.getIndex() + 1}`);
    historyItemId = section.getHistoryItemId();
    if (historyItemId.substring(0, 4) === "pyro") {
      const audioUrl = await fetchAudioFromPyroBackendDistribution(
        historyItemId,
        0
      );
      setShowAudioPlayer(true);
      setAudioUrl(audioUrl);
      setNowPlayingUrl(audioUrl);
    } else {
      await fetchAudioFromElevenLabsWrapper(historyItemId);
    }
  };

  const localPushData = (newData, clone = false) => {
    localStack.push(newData);
    if (clone) {
      setLocalStack(localStack.clone());
    } else {
      setLocalStack(localStack);
    }
  };

  const syncLocalStackWithGlobal = () => {
    syncStackWithGlobal(localStack);
  };

  const handleEditSection = (section) => {
    if (generatedVoiceUrl) {
      URL.revokeObjectURL(generatedVoiceUrl);
      setGeneratedVoiceUrl("");
    }
    localPushData("/advanced-mode/script-to-ad/stitch-sections");
    syncLocalStackWithGlobal();

    handleSaveState();

    router.push(
      "/advanced-mode/script-to-ad/process-section/[idx]",
      `/advanced-mode/script-to-ad/process-section/${section.getIndex()}`
    );
  };

  const handleContentClick = (content) => {
    setContentModalText(content);
    setShowContentModal(true);
  };

  if (pendingAdvertisement) {
    return (
      <div
        className="d-flex align-items-center justify-content-center flex-column"
        style={{ height: "100vh", backgroundColor: "#FFFFFF" }}
      >
        <Spinner
          animation="border"
          variant="primary"
          style={{ marginBottom: "200px" }}
        />

        <Card
          className="p-4"
          style={{
            marginTop: "300px",
            borderRadius: "1rem",
            borderColor: "#eb631c",
            color: "black",
          }}
        >
          <p
            className="ml-3 mb-0"
            style={{
              fontWeight: "bold",
              fontSize: "24px",
              color: "black",
              textShadow: "1px 1px 1px #000",
            }}
          >
            Just a second. We are cooking up your final voice cut!
          </p>
        </Card>
        <div className="mt-3">
          <Button
            variant="danger"
            onClick={cancelLoading}
            style={{ marginRight: "20px", width: "200px" }}
            title="Stop the current operation and start from the beginning."
          >
            Cancel and Start Over
          </Button>

          <Button
            onClick={cancelAndRetryLoading}
            style={{
              width: "200px",
              backgroundColor: "#FDA942",
              borderColor: "#FDA942",
            }}
            title="Stop the current order and retry with the same data."
          >
            Cancel and Resubmit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Arial, sans-serif",
        color: "#333",
      }}
    >
      <NavBar
        links={[]}
        logoutHandler={handleLogout}
        saveHandler={handleSaveState}
      />

      <Card
        style={{
          margin: "20px",
          borderRadius: "1rem",
          borderColor: "#eb631c",
          color: "black",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontWeight: "bold",
            fontSize: "1.3em",
            marginTop: "20px",
            color: "#333",
          }}
        >
          <i
            className="bi bi-pencil-square"
            style={{
              cursor: "pointer",
              marginRight: "10px",
              marginLeft: "10px",
              fontSize: "1em",
            }}
            onClick={() => setShowRenameModal(true)}
          ></i>
          {spotName}
        </div>
        <Card.Body>
          <Card.Title style={{ color: "#000000" }}>Sections Overview</Card.Title>
          <div
            style={{
              overflowY: "auto",
              maxHeight: "600px",
              overflowX: "hidden",
            }}
          >
            <Table bordered hover style={{ borderColor: "#eb631c" }}>
              <thead style={{ backgroundColor: "#eb631c", color: "white" }}>
                <tr>
                  <th style={{ borderColor: "#eb631c", textAlign: "center" }}>
                    Section ID
                  </th>
                  <th style={{ borderColor: "#eb631c", textAlign: "center" }}>
                    Voice Name
                  </th>
                  <th style={{ borderColor: "#eb631c", textAlign: "center" }}>
                    Section Content
                  </th>
                  <th style={{ borderColor: "#eb631c", textAlign: "center" }}>
                    Duration
                  </th>
                  <th style={{ borderColor: "#eb631c", textAlign: "center" }}>
                    Section End Pause
                  </th>
                  <th style={{ borderColor: "#eb631c", textAlign: "center" }}>
                    Play
                  </th>
                  <th style={{ borderColor: "#eb631c", textAlign: "center" }}>
                    Edit
                  </th>
                </tr>
              </thead>
              <tbody>
                {localSectionsArray.map((section, index) => (
                  <tr key={index}>
                    <td style={{ border: "1px solid #eb631c", textAlign: "center", verticalAlign: "middle" }}>
                      {index + 1}
                    </td>
                    <td style={{ border: "1px solid #eb631c", textAlign: "center", verticalAlign: "middle" }}>
                      {section.getVoiceName()}
                    </td>
                    <td
                      style={{
                        border: "1px solid #eb631c",
                        textAlign: "center",
                        verticalAlign: "middle",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        cursor: "pointer",
                      }}
                      onClick={() => handleContentClick(section.getCurrentContent())}
                    >
                      {section.getCurrentContent().length > 30 ? (
                        <>
                          {`${section.getCurrentContent().substring(0, 30)}`}
                          <span style={{ color: "#808080", fontStyle: "italic" }}> ...see more</span>
                        </>
                      ) : (
                        section.getCurrentContent()
                      )}
                    </td>
                    <td style={{ border: "1px solid #eb631c", textAlign: "center", verticalAlign: "middle" }}>
                      {section.getSectionDurationSeconds().toFixed(2)} sec
                    </td>
                    <td style={{ border: "1px solid #eb631c", textAlign: "center", verticalAlign: "middle", padding: "0" }}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "100%",
                        }}
                      >
                        <span style={{ marginRight: "8px" }}>
                          {section.getEndOfSectionPauseDurationSeconds()} sec
                        </span>
                        <EditButton onClickHandler={() => showEditPauseDurationModal(index)} />
                        <EditPauseDurationModal
                          show={isEditPauseModalVisible}
                          onHide={() => setEditPauseModalVisible(false)}
                          initialValue={section.getEndOfSectionPauseDurationSeconds()}
                          onSave={(newPauseDuration) => {
                            if (currentEditingSectionIndex !== null) {
                              updatePauseDuration(currentEditingSectionIndex, newPauseDuration);
                            }
                            setEditPauseModalVisible(false);
                          }}
                          maxValue={Math.floor(
                            adLength -
                            localSectionsArray.reduce(
                              (acc, section) => acc + section.sectionDurationSeconds + section.getEndOfSectionPauseDurationSeconds(),
                              0
                            ).toFixed(2)
                          )}
                        />
                      </div>
                    </td>
                    <td style={{ border: "1px solid #eb631c", textAlign: "center", verticalAlign: "middle" }}>
                      <PlayButton onClickHandler={() => handleSectionPreviewPlay(section)} size="28px" />
                    </td>
                    <td style={{ border: "1px solid #eb631c", textAlign: "center", verticalAlign: "middle" }}>
                      <EditButton onClickHandler={() => handleEditSection(section)} size="28px" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          <div
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              backgroundColor: "#f9f9f9",
              borderRadius: "10px",
              fontSize: "1em",
              color: "#333",
            }}
          >
            <div style={{ marginBottom: "10px" }}>
              Total duration without pauses:{" "}
              {localSectionsArray.reduce((acc, section) => acc + section.sectionDurationSeconds, 0).toFixed(2)}{" "}
              seconds
            </div>
            <div>
              Total duration with pauses:{" "}
              {localSectionsArray.reduce(
                (acc, section) =>
                  acc + section.sectionDurationSeconds + section.getEndOfSectionPauseDurationSeconds(),
                0
              ).toFixed(2)}{" "}
              seconds
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setForceRenderKey(Math.random().toString());
                  setShowAudioPlayer(true);
                  setNowPlayingUrl(combinedVoiceoverUrl);
                  setAudioTitle("Final Cut");
                }}
                style={{
                  backgroundColor: "#eb631c",
                  borderColor: "#eb631c",
                  color: "white",
                  textDecoration: "none",
                }}
                disabled={!combinedVoiceoverUrl}
              >
                <i className="bi bi-arrow-clockwise" style={{ verticalAlign: "middle" }}></i>
                <span style={{ verticalAlign: "middle", marginLeft: "8px" }}>
                  Replay Final Cut
                </span>
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "10px 20px",
          margin: "20px 0 0",
        }}
      >
        <Button
          onClick={combinedVoiceoverUrl === null ? handleSubmit : handleNext}
          style={{
            width: "200px",
            backgroundColor: "#eb631c",
            borderColor: "#eb631c",
          }}
        >
          {combinedVoiceoverUrl === null ? "Finalize" : "Next"}
        </Button>
        <SecondaryActionButton
          initialText="Save"
          clickedText="Saved!"
          borderColor="#FDA942"
          onClick={handleSaveState}
        />
      </div>

      <div style={{ position: "relative" }}>
        {showAudioPlayer && (
          <SimpleAudioPlayer
            audioSrc={nowPlayingUrl}
            audioTitle={audioTitle}
            forceRender={forceRenderKey}
            autoplay={true}
            allowDownload={true}
            setShowAudioPlayer={setShowAudioPlayer}
          />
        )}
      </div>
      <RenameModal
        show={showRenameModal}
        onHide={() => setShowRenameModal(false)}
        newSpotName={newSpotName}
        setNewSpotName={setNewSpotName}
        spotId={spotId}
        setSpotName={setSpotName}
      />
      <Modal show={showContentModal} onHide={() => setShowContentModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Section Content</Modal.Title>
        </Modal.Header>
        <Modal.Body>{contentModalText}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowContentModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );


}

export default StitchSections;

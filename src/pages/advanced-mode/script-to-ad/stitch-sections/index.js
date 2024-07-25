import React, { useState, useEffect, useRef } from "react";
import { getAuth } from "firebase/auth";
import { useRouter } from "next/router";
import axios from "axios";
import Swal from "sweetalert2";
import _ from "lodash";
import { usePostHog } from "posthog-js/react";
import { Card, Button, Modal } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";
import RenameModal from "@/components/rename-modal";
import SimpleAudioPlayer from "@/components/simple-audio-player";
import { NavBar } from "@/components/foundation-components/nav-bar";
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
import LoadingScreen from "@/_pages/advanced-mode/script-to-ad/stitch-sections/components/loading-screen";
import SectionsTable from "@/_pages/advanced-mode/script-to-ad/stitch-sections/components/sections-table";
import NavigationButtons from "@/_pages/advanced-mode/script-to-ad/stitch-sections/components/navigation-buttons";
import InfoPad from "@/_pages/advanced-mode/script-to-ad/stitch-sections/components/info-pad";
import { SecondaryActionButton } from "@/components/buttons/secondary-action-button";

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

  const getPageSize = () => {
    const height = window.innerHeight;
    if (height < 768) return 3; // Example: 2 rows per page for medium screens
    if (height < 992) return 4; // Example: 3 rows per page for large screens
    if (height < 1200) return 7; // Example: 4 rows per page for extra large screens
    return 10; // Example: 5 rows per page for extra extra large screens
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(getPageSize());

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

  useEffect(() => {
    const handleResize = () => {
      setPageSize(getPageSize());
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when page size changes
  }, [pageSize]);

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

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (pendingAdvertisement) {
    return (
      <LoadingScreen
        cancelLoading={cancelLoading}
        cancelAndRetryLoading={cancelAndRetryLoading}
      />
    );
  }

  const indexOfLastSection = currentPage * pageSize;
  const indexOfFirstSection = indexOfLastSection - pageSize;
  const currentSections = localSectionsArray.slice(
    indexOfFirstSection,
    indexOfLastSection
  );
  const totalPages = Math.ceil(localSectionsArray.length / pageSize);

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
          <div
            style={{
              overflowY: "auto",
              maxHeight: "700px",
              overflowX: "hidden",
            }}
          >
            <SectionsTable
              currentSections={currentSections}
              indexOfFirstSection={indexOfFirstSection}
              handleContentClick={handleContentClick}
              showEditPauseDurationModal={showEditPauseDurationModal}
              isEditPauseModalVisible={isEditPauseModalVisible}
              setEditPauseModalVisible={setEditPauseModalVisible}
              updatePauseDuration={updatePauseDuration}
              currentEditingSectionIndex={currentEditingSectionIndex}
              adLength={adLength}
              localSectionsArray={localSectionsArray}
              handleSectionPreviewPlay={handleSectionPreviewPlay}
              handleEditSection={handleEditSection}
            />
          </div>
          <NavigationButtons
            handlePreviousPage={handlePreviousPage}
            handleNextPage={handleNextPage}
            currentPage={currentPage}
            totalPages={totalPages}
          />
          <InfoPad
            localSectionsArray={localSectionsArray}
            adLength={adLength}
            combinedVoiceoverUrl={combinedVoiceoverUrl}
            setForceRenderKey={setForceRenderKey}
            setShowAudioPlayer={setShowAudioPlayer}
            setNowPlayingUrl={setNowPlayingUrl}
            setAudioTitle={setAudioTitle}
          />
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
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default withAuth(StitchSections);

import React, { useState, useEffect, useRef } from "react";
import useUserInputsStore from "../../../store/userInputs";
import SimpleAudioPlayer from "../../../components/SimpleAudioPlayer";
import { getAuth } from "firebase/auth";
import withAuth from "../../../hocs/withAuth";
import { useRouter } from "next/router";
import axios from "axios";
import Swal from "sweetalert2";
import _ from "lodash";
import { usePostHog } from "posthog-js/react";

import { Card, Button, Table } from "react-bootstrap";
import { NavBar } from "@/components/navBar";
import { PlayButton } from "@/components/buttons/playButton/play";
import { EditButton } from "@/components/buttons/editButton/edit";
import { EditPauseDurationModal } from "@/components/editPauseDurationModal/modal";

import "bootstrap-icons/font/bootstrap-icons.css";
import Spinner from "../../../components/Spinner";
import { Stack } from "../../../dataStructures/stack";
import { fetchAudioFromPyroBackendDistribution } from "../../../utils/fetchFromDistribution";

function StitchSections() {
  const auth = getAuth();
  const router = useRouter();
  const posthog = usePostHog();

  const {
    sectionsArray,
    setSectionsArray,
    adLength,
    reset: resetUserInputsStore,
    generatedVoiceUrl,
    setGeneratedVoiceUrl,
    setStitchedAudioPyroHistoryItemId,
  } = useUserInputsStore();
  const [localStack, setLocalStack] = useState(() => new Stack());
  const syncStackWithGlobal = useUserInputsStore(
    (state) => state.setNavigationStack
  );
  const [isEditPauseModalVisible, setEditPauseModalVisible] = useState(false);
  const [currentEditingSectionIndex, setCurrentEditingSectionIndex] =
    useState(null);

  const [audioUrl, setAudioUrl] = useState("");
  const [audioTitle, setAudioTitle] = useState("");
  const [selectedSection, setSelectedSection] = useState(null);
  const [pendingAdvertisement, setPendingAdvertisement] = useState(false);
  const [combinedVoiceoverUrl, setCombinedVoiceoverUrl] = useState(null);
  const [nowPlayingUrl, setNowPlayingUrl] = useState(false);
  const [forceRenderKey, setForceRenderKey] = useState(0);
  const [localSectionsArray, setLocalSectionsArray] = useState(sectionsArray);
  const musicGenWebServiceUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:8000"
      : "https://vgz580uujk.execute-api.us-east-2.amazonaws.com";

  const cancelTokenSourceRef = useRef(null);

  useEffect(() => {
    calculateTotalDuration();
  }, [localSectionsArray]);

  useEffect(() => {
    // prevent back button
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = ""; // Chrome requires returnValue to be set
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
      (acc, section) => {
        return (
          acc +
          section.sectionDurationSeconds +
          section.getEndOfSectionPauseDurationSeconds()
        );
      },
      0
    );

    return {
      totalDurationWithoutPauses,
      totalDurationWithPauses,
    };
  };
  const showEditPauseDurationModal = (sectionIndex) => {
    console.log("Opening modal for section index:", sectionIndex);
    setCurrentEditingSectionIndex(sectionIndex);
    setEditPauseModalVisible(true);
  };

  const updatePauseDuration = (index, newDuration) => {
    let newArray = [...localSectionsArray];
    let sectionToUpdate = newArray[index];

    // Ensure that the new duration is a valid number. If not, temporarily set it to 0.
    const validDuration =
      isNaN(parseFloat(newDuration)) || newDuration === ""
        ? 0
        : parseFloat(newDuration);
    sectionToUpdate.setEndOfSectionPauseDurationSeconds(validDuration);

    // Calculate the total duration with the new pause duration
    const totalDurationWithPauses = newArray.reduce(
      (acc, section) =>
        acc +
        section.sectionDurationSeconds +
        section.getEndOfSectionPauseDurationSeconds(),
      0
    );

    // Check if the total duration with pauses exceeds the ad length
    if (totalDurationWithPauses > adLength) {
      Swal.fire({
        title: "Exceeded Ad Length",
        text: `Added pause will exceed your overall ad length, so it is reverted to 0 seconds.`,
        icon: "warning",
        confirmButtonText: "Ok",
      });

      // Revert the pause duration to 0 as it exceeds ad length
      sectionToUpdate.setEndOfSectionPauseDurationSeconds(0);
    }

    // Update the state to reflect the changes (or reversion to 0)
    setLocalSectionsArray(newArray);
  };

  const fetchAudioFromElevenLabs = (historyItemId) => {
    fetch("/api/Elevenlabs/generate_voice_with_history_item_id", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ historyItemId }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch audio");
        }
        return response.blob(); // Handle the response as a blob
      })
      .then((blob) => {
        const audioUrl = URL.createObjectURL(blob); // Create a URL for the blob
        setAudioUrl(audioUrl);
        setNowPlayingUrl(audioUrl);
      })
      .catch((err) => console.error(err));
  };

  const handleNext = (e) => {
    e.preventDefault();
    setGeneratedVoiceUrl(combinedVoiceoverUrl);
    router.push("/add_music");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPendingAdvertisement(true);

    const userId = auth.currentUser ? auth.currentUser.uid : "anonymous";

    posthog.capture("stitch-sections-finalize-voiceover-button-clicked", {
      userId: userId, // Capture the Firebase user ID
      script: sectionsArray
        .map((section) => section.getCurrentContent())
        .join(". "),
    });
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
    // Send POST request to the API
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
        setCombinedVoiceoverUrl(audioUrl);
        setNowPlayingUrl(audioUrl);
        setAudioTitle("Final Cut");
        setForceRenderKey(Math.random().toString());
        setStitchedAudioPyroHistoryItemId(pyroHistoryItemId);
      } else if (response.data.error) {
        // Handle case where API returned an error
        console.error(
          "API returned an error:",
          response.data.error,
          response.data.details ? response.data.details : ""
        );
      }
    } catch (error) {
      console.error("Error fetching pyro_history_item_id:", error);
    } finally {
      setPendingAdvertisement(false); // Set pending to false when API call completes
    }
    setSectionsArray(localSectionsArray);
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
      showConfirmButton: true, // show the confirmation button
      confirmButtonText: "OK",
      allowOutsideClick: false,
    }).then((result) => {
      // If the modal was closed by the confirmation button, redirect.
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

      setAudioUrl(audioUrl);
      setNowPlayingUrl(audioUrl);
    } else {
      fetchAudioFromElevenLabs(historyItemId);
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

    router.push(
      "/advanced-mode/script-to-ad/process-section/[idx]",
      `/advanced-mode/script-to-ad/process-section/${section.getIndex()}`
    );
  };

  const links = [
    {
      label: "Home",
      url: "/home",
      isInternal: true,
      icon: "bi bi-house", // Bootstrap icon class
      style: { marginRight: "10px" }, // Example styling
    },
    // {
    //   label: "About",
    //   url: "/about",
    //   // Optionally, some links might not have an icon
    //   style: { marginRight: "10px" },
    // },
    // Add more links as needed
  ];

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
            style={{ marginRight: "20px", width: "200px" }} // Setting a fixed width
            title="Stop the current operation and start from the beginning."
          >
            Cancel and Start Over
          </Button>

          <Button
            // variant="warning"
            onClick={cancelAndRetryLoading}
            style={{
              width: "200px",
              backgroundColor: "#FDA942",
              borderColor: "#FDA942",
            }} // Setting the same fixed width
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
      }}
    >
      <NavBar links={links} logoutHandler={handleLogout} />

      <Card
        style={{
          margin: "20px",
          borderRadius: "1rem",
          borderColor: "#eb631c",
          color: "black",
        }}
      >
        <Card.Body>
          <Card.Title style={{ color: "white" }}>Sections Overview</Card.Title>
          <div
            style={{
              overflowY: "auto",
              maxHeight: "600px",
              overflowX: "hidden",
            }}
          >
            <Table bordered hover style={{ borderColor: "#eb631c" }}>
              <thead style={{ backgroundColor: "#eb631c" }}>
                <tr>
                  <th
                    style={{
                      borderColor: "#eb631c",
                      textAlign: "center",
                    }}
                  >
                    Section ID
                  </th>
                  <th
                    style={{
                      borderColor: "#eb631c",
                      textAlign: "center",
                    }}
                  >
                    Voice Name
                  </th>
                  <th
                    style={{
                      borderColor: "#eb631c",
                      textAlign: "center",
                    }}
                  >
                    Section Content
                  </th>
                  <th
                    style={{
                      borderColor: "#eb631c",
                      textAlign: "center",
                    }}
                  >
                    Duration
                  </th>
                  <th
                    style={{
                      borderColor: "#eb631c",
                      maxWidth: "220px", // Adjust this value as needed
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      textAlign: "center",
                    }}
                  >
                    Section End Pause
                  </th>
                  <th
                    style={{
                      borderColor: "#eb631c",
                      textAlign: "center",
                    }}
                  >
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
                    {/* Other cells */}
                    <td
                      style={{
                        border: "1px solid #eb631c",
                        verticalAlign: "middle",
                        textAlign: "center",
                      }}
                    >
                      {index + 1}
                    </td>
                    <td
                      style={{
                        border: "1px solid #eb631c",
                        verticalAlign: "middle",
                        textAlign: "center",
                      }}
                    >
                      {section.getVoiceName()}
                    </td>
                    <td
                      style={{
                        border: "1px solid #eb631c",
                        verticalAlign: "middle",
                        textAlign: "center",
                      }}
                    >
                      {section.getCurrentContent()}
                    </td>
                    <td
                      style={{
                        border: "1px solid #eb631c",
                        verticalAlign: "middle",
                        textAlign: "center",
                      }}
                    >
                      {section.getSectionDurationSeconds().toFixed(2)} sec
                    </td>
                    {/* Adjusted cell for section end pause with EditButton */}
                    <td
                      style={{
                        border: "1px solid #eb631c",
                        verticalAlign: "middle",
                        textAlign: "center",
                        padding: "0", // Remove any default padding if necessary
                      }}
                    >
                      {/* Span for the duration and EditButton wrapped in a div */}
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "100%", // Take up full width of the cell
                        }}
                      >
                        <span style={{ marginRight: "8px" }}>
                          {section.getEndOfSectionPauseDurationSeconds()} sec
                        </span>
                        <EditButton
                          onClickHandler={() =>
                            showEditPauseDurationModal(index)
                          }
                        />
                        <EditPauseDurationModal
                          show={isEditPauseModalVisible}
                          onHide={() => setEditPauseModalVisible(false)}
                          initialValue={section.getEndOfSectionPauseDurationSeconds()}
                          onSave={(newPauseDuration) => {
                            if (currentEditingSectionIndex !== null) {
                              updatePauseDuration(
                                currentEditingSectionIndex,
                                newPauseDuration
                              );
                            }
                            setEditPauseModalVisible(false);
                          }}
                          maxValue={Math.floor(
                            adLength -
                              localSectionsArray
                                .reduce(
                                  (acc, section) =>
                                    acc +
                                    section.sectionDurationSeconds +
                                    section.getEndOfSectionPauseDurationSeconds(),
                                  0
                                )
                                .toFixed(2)
                          )}
                        />
                      </div>
                    </td>
                    {/* Other cells */}
                    <td
                      style={{
                        border: "1px solid #eb631c",
                        verticalAlign: "middle",
                        textAlign: "center",
                      }}
                    >
                      <PlayButton
                        onClickHandler={() => handleSectionPreviewPlay(section)}
                        size="28px"
                      />
                    </td>
                    <td
                      style={{
                        border: "1px solid #eb631c",
                        verticalAlign: "middle",
                        textAlign: "center",
                      }}
                    >
                      <EditButton
                        onClickHandler={() => handleEditSection(section)}
                        size="28px"
                      />
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
              backgroundColor: "#e4e4e4",
              borderRadius: "10px",
            }}
          >
            <div style={{ color: "black", marginBottom: "10px" }}>
              {" "}
              {/* Add some margin to separate the lines */}
              Total duration without pauses:{" "}
              {localSectionsArray
                .reduce(
                  (acc, section) => acc + section.sectionDurationSeconds,
                  0
                )
                .toFixed(2)}{" "}
              seconds
            </div>
            <div style={{ color: "black" }}>
              Total duration with pauses:{" "}
              {localSectionsArray
                .reduce(
                  (acc, section) =>
                    acc +
                    section.sectionDurationSeconds +
                    section.getEndOfSectionPauseDurationSeconds(),
                  0
                )
                .toFixed(2)}{" "}
              seconds
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              {combinedVoiceoverUrl !== null ? (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setForceRenderKey(Math.random().toString());
                    setNowPlayingUrl(combinedVoiceoverUrl);
                    setAudioTitle("Final Cut");
                  }}
                  style={{
                    backgroundColor: "#eb631c", // Orange color
                    borderColor: "#eb631c", // Orange border
                    color: "white", // Ensuring text and icon are visible
                    textDecoration: "none", // Removing any underline from the link variant
                  }}
                >
                  <i
                    class="bi bi-arrow-clockwise"
                    style={{ verticalAlign: "middle" }}
                  ></i>
                  <span style={{ verticalAlign: "middle", marginLeft: "8px" }}>
                    Replay Final Cut
                  </span>
                </Button>
              ) : null}
            </div>
          </div>
        </Card.Body>
      </Card>

      {combinedVoiceoverUrl === null ? (
        <Button
          onClick={handleSubmit}
          style={{
            margin: "20px",
            width: "200px",
            backgroundColor: "#eb631c",
            borderColor: "#eb631c",
          }}
        >
          Finalize
        </Button>
      ) : (
        <Button
          onClick={handleNext}
          style={{
            margin: "20px",
            width: "200px",
            backgroundColor: "#eb631c",
            borderColor: "#eb631c",
          }}
        >
          Next
        </Button>
      )}
      <div style={{ position: "relative", marginTop: "400px" }}>
        {nowPlayingUrl && (
          <SimpleAudioPlayer
            audioSrc={nowPlayingUrl}
            audioTitle={audioTitle}
            forceRender={forceRenderKey}
            autoplay={true}
            allowDownload={true}
          />
        )}
      </div>
    </div>
  );
}

export default withAuth(StitchSections);

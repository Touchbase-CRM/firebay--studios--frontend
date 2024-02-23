import React, { useState, useEffect, useRef } from "react";
import useUserInputsStore from "../store/userInputs";
import SimpleAudioPlayer from "../components/SimpleAudioPlayer";
import { getAuth } from "firebase/auth";
import withAuth from "../hocs/withAuth";
import { useRouter } from "next/router";
import axios from "axios";
import Swal from "sweetalert2";
import _ from "lodash";
import { usePostHog } from "posthog-js/react";

import {
  Row,
  Col,
  Card,
  Form,
  Navbar,
  Nav,
  Button,
  Table,
  Spinner as BootstrapSpinner,
} from "react-bootstrap";
import { Play } from "react-bootstrap-icons";
import "bootstrap-icons/font/bootstrap-icons.css";
import Spinner from "../components/Spinner";

function StitchSections() {
  const auth = getAuth();
  const router = useRouter();
  const posthog = usePostHog();

  const {
    sectionsArray,
    setSectionsArray,
    tempSectionObjHolder,
    adLength,
    reset: resetUserInputsStore,
    generatedVoiceUrl,
    setGeneratedVoiceUrl,
    setStitchedAudioPyroHistoryItemId,
    setCurrentSectionObjZustand,
    lastEditedSectionIdx,
    setLastEditedSectionIdx,
  } = useUserInputsStore();

  console.log("sectionsArray at stitch sections", sectionsArray);

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
    const index = tempSectionObjHolder.getIndex();
    if (index !== lastEditedSectionIdx) {
      localSectionsArray[index] = tempSectionObjHolder;
      setLocalSectionsArray(localSectionsArray);
      setSectionsArray(localSectionsArray);
    }
    // else {
    //   setLocalSectionsArray(sectionsArray);
    // }
  }, []);

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

  async function fetchAudioFromPyroBackendDistribution(pyroHistoryItemId) {
    const bucketName = "workingdir--storage";
    const objectName = `primary--distribution/${pyroHistoryItemId}`;

    try {
      // Make a POST request to your API route, sending the object name to get the signed URL
      const response = await fetch("/api/S3/fetchAudioFromS3", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bucketName, objectName }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Use the signed URL directly for audio playback or download
      // Here, return the URL for further use, such as setting it as the src for an audio element
      return data.url;
    } catch (error) {
      console.error("Error fetching audio URL from API:", error);
      throw new Error("Failed to fetch audio URL from API");
    }
  }
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
          pyroHistoryItemId
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
        historyItemId
      );

      setAudioUrl(audioUrl);
      setNowPlayingUrl(audioUrl);
    } else {
      fetchAudioFromElevenLabs(historyItemId);
    }
  };

  const handleEditSection = (section) => {
    setCurrentSectionObjZustand(section);
    setLastEditedSectionIdx(section.getIndex());
    if (generatedVoiceUrl) {
      URL.revokeObjectURL(generatedVoiceUrl);
      setGeneratedVoiceUrl("");
    }
    router.push("/process_section");
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
      <Navbar
        expand="lg"
        style={{ marginBottom: "5px", backgroundColor: "#e4e4e4" }} // Set the navbar background to #e4e4e4
      >
        <Navbar.Brand style={{ marginLeft: "10px" }}>
          <img
            src="/fire.png"
            width="50"
            height="50"
            className="d-inline-block align-top"
          />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">{/* Nav items here */}</Nav>
        </Navbar.Collapse>
        <Button
          variant="light"
          size="sm"
          onClick={handleLogout}
          style={{
            marginRight: "10px",
            padding: "5px 10px",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <i
            className="bi bi-box-arrow-right"
            style={{ marginRight: "5px" }}
          ></i>
          Logout
        </Button>
      </Navbar>

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
                    }}
                  >
                    Section ID
                  </th>
                  <th
                    style={{
                      borderColor: "#eb631c",
                    }}
                  >
                    Original Section
                  </th>
                  <th
                    style={{
                      borderColor: "#eb631c",
                    }}
                  >
                    Revised Section
                  </th>
                  <th
                    style={{
                      borderColor: "#eb631c",
                    }}
                  >
                    Duration (Sec)
                  </th>
                  <th
                    style={{
                      borderColor: "#eb631c",
                      maxWidth: "220px", // Adjust this value as needed
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    Section End Pause (Sec)
                  </th>
                  <th
                    style={{
                      borderColor: "#eb631c",
                    }}
                  >
                    Play
                  </th>
                  <th style={{ borderColor: "#eb631c" }}>Edit</th>
                </tr>
              </thead>
              <tbody>
                {localSectionsArray.map((section, index) => (
                  <tr key={index}>
                    <td style={{ border: "1px solid #eb631c" }}>{index + 1}</td>
                    <td style={{ border: "1px solid #eb631c" }}>
                      {section.originalContent}
                    </td>
                    <td style={{ border: "1px solid #eb631c" }}>
                      {section.currentContent}
                    </td>
                    <td style={{ border: "1px solid #eb631c" }}>
                      {section.sectionDurationSeconds.toFixed(2)}
                    </td>
                    <td
                      style={{
                        border: "1px solid #eb631c",
                        maxWidth: "220px", // Keep consistent with the header
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {combinedVoiceoverUrl === null ? (
                        <input
                          type="number"
                          value={section.getEndOfSectionPauseDurationSeconds()}
                          onChange={(e) =>
                            updatePauseDuration(index, e.target.value)
                          }
                          min="0"
                          max="10"
                          step="0.1"
                          style={{
                            width: "30%",
                            backgroundColor: "#e4e4e4",
                            borderColor: "#e4e4e4",
                            color: "black",
                          }}
                        />
                      ) : (
                        // Displaying the pause duration value if combinedVoiceoverUrl is null
                        <div>
                          {section.getEndOfSectionPauseDurationSeconds()}{" "}
                          seconds
                        </div>
                      )}
                    </td>
                    <td style={{ border: "1px solid #eb631c" }}>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSectionPreviewPlay(section);
                        }}
                        style={{
                          backgroundColor: "#eb631c", // Orange color
                          borderColor: "#eb631c", // Orange border
                          color: "white", // Adjust if needed to ensure the icon is visible
                        }}
                      >
                        <i className="bi bi-play-circle"></i>
                      </Button>
                    </td>
                    <td style={{ border: "1px solid #eb631c" }}>
                      <Button
                        onClick={() => handleEditSection(section)}
                        style={{
                          backgroundColor: "#eb631c", // Orange color
                          borderColor: "#eb631c", // Orange border
                          color: "white", // Adjust if needed to ensure the icon is visible
                        }}
                      >
                        <i className="bi bi-pencil-square"></i>
                      </Button>
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
          Finalize the voiceover
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

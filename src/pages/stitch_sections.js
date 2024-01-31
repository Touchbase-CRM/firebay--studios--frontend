import React, { useState, useEffect, useRef } from "react";
import useUserInputsStore from "../store/userInputs";
import SimpleAudioPlayer from "../components/SimpleAudioPlayer";
import { getAuth } from "firebase/auth";
import withAuth from "../hocs/withAuth";
import { useRouter } from "next/router";
import axios from "axios";
import Swal from "sweetalert2";
import _ from "lodash";

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
  const {
    sectionsArray,
    adLength,
    reset: resetUserInputsStore,
    setGeneratedVoiceUrl,
  } = useUserInputsStore();
  const [audioUrl, setAudioUrl] = useState("");
  const [audioTitle, setAudioTitle] = useState("");
  const [selectedSection, setSelectedSection] = useState(null);
  const [pendingAdvertisement, setPendingAdvertisement] = useState(false);
  const [combinedVoiceoverUrl, setCombinedVoiceoverUrl] = useState(null);
  const [nowPlayingUrl, setNowPlayingUrl] = useState(false);
  const [forceRenderKey, setForceRenderKey] = useState(0);
  const [localSectionArray, setLocalSectionArray] = useState([]);

  const musicGenWebServiceUrl =
    "https://vgz580uujk.execute-api.us-east-2.amazonaws.com";
  // const musicGenWebServiceUrl = "http://localhost:8000"; // For local testing
  const cancelTokenSourceRef = useRef(null);

  useEffect(() => {
    calculateTotalDuration();
  }, [localSectionArray]);

  useEffect(() => {
    setLocalSectionArray(_.cloneDeep(sectionsArray));
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
    const totalDurationWithoutPauses = localSectionArray.reduce(
      (acc, section) => acc + section.sectionDurationSeconds,
      0
    );

    const totalDurationWithPauses = localSectionArray.reduce((acc, section) => {
      return (
        acc +
        section.sectionDurationSeconds +
        section.getEndOfSectionPauseDurationSeconds()
      );
    }, 0);

    return {
      totalDurationWithoutPauses,
      totalDurationWithPauses,
    };
  };

  const updatePauseDuration = (index, newDuration) => {
    let newArray = [...localSectionArray];
    let sectionToUpdate = newArray[index];
    sectionToUpdate.setEndOfSectionPauseDurationSeconds(
      parseFloat(newDuration)
    );
    setLocalSectionArray(newArray);

    // Now, calculate the new total duration with pauses
    const totalDurationWithPauses = newArray.reduce(
      (acc, section) =>
        acc +
        section.sectionDurationSeconds +
        section.getEndOfSectionPauseDurationSeconds(),
      0
    );

    // Check if the total duration with pauses exceeds the ad length
    if (totalDurationWithPauses > adLength) {
      const overLength = totalDurationWithPauses - adLength;
      Swal.fire({
        title: "Exceeded Ad Length",
        text: `You have exceeded the ad length by ${overLength.toFixed(
          2
        )} seconds.`,
        icon: "warning",
        confirmButtonText: "Ok",
      });
    }
  };

  const fetchAudio = (historyItemId) => {
    const options = {
      method: "POST",
      headers: {
        "xi-api-key": process.env.NEXT_PUBLIC_ELEVEN_LABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ history_item_ids: [historyItemId] }),
    };

    fetch("https://api.elevenlabs.io/v1/history/download", options)
      .then((response) => response.blob()) // Handle the response as a blob
      .then((blob) => {
        const audioUrl = URL.createObjectURL(blob); // Create a URL for the blob
        setAudioUrl(audioUrl);
        setNowPlayingUrl(audioUrl);
      })
      .catch((err) => console.error(err));
  };

  const currentTotalDuration = sectionsArray.reduce(
    (acc, section) => acc + section.sectionDurationSeconds,
    0
  );
  const handleNext = (e) => {
    e.preventDefault();
    setGeneratedVoiceUrl(combinedVoiceoverUrl);
    router.push("/add_music");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setPendingAdvertisement(true);

    const userId = auth.currentUser ? auth.currentUser.uid : "anonymous";
    cancelTokenSourceRef.current = axios.CancelToken.source();

    const historyItemIds = sectionsArray.map((section) =>
      section.getHistoryItemId()
    );
    const payload = {
      user_id: userId,
      history_item_id_list: historyItemIds,
    };
    const url = `${musicGenWebServiceUrl}/stitch-sections`;
    // Send POST request to the API
    axios
      .post(url, payload, {
        responseType: "arraybuffer",
        cancelToken: cancelTokenSourceRef.current.token, // Using the token from useRef
      })
      .then((response) => {
        console.log("Audio data received");

        const audioBlob = new Blob([response.data], { type: "audio/mp3" });
        const audioUrl = URL.createObjectURL(audioBlob);

        setCombinedVoiceoverUrl(audioUrl);
        setNowPlayingUrl(audioUrl);
        setAudioTitle("Final Cut");
        setForceRenderKey(Math.random().toString());
      })
      .catch((error) => {
        if (axios.isCancel(error)) {
          console.log("Request was canceled:", error.message);
        } else if (error.response) {
          console.error(
            `Failed to retrieve audio. Status code: ${error.response.status}, Message: ${error.response.data}`
          );
        } else if (error.request) {
          console.error(`No response received: ${error.request}`);
        } else {
          console.error(`Error: ${error.message}`);
        }
      })
      .finally(() => {
        setPendingAdvertisement(false); // Set pending to false when API call completes
      });
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
              maxHeight: "800px",
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
                    Initial Section
                  </th>
                  <th
                    style={{
                      borderColor: "#eb631c",
                    }}
                  >
                    Current Section
                  </th>
                  <th
                    style={{
                      borderColor: "#eb631c",
                    }}
                  >
                    Duration (Seconds)
                  </th>
                  <th style={{ borderColor: "#eb631c" }}>
                    Length of the Pause at the End of the Section (Seconds)
                  </th>
                  <th
                    style={{
                      borderColor: "#eb631c",
                    }}
                  >
                    Play
                  </th>
                </tr>
              </thead>
              <tbody>
                {localSectionArray.map((section, index) => (
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
                    <td style={{ border: "1px solid #eb631c" }}>
                      <input
                        type="number"
                        value={section.getEndOfSectionPauseDurationSeconds()}
                        onChange={(e) =>
                          updatePauseDuration(index, e.target.value)
                        }
                        min="0"
                        max="10"
                        step="0.1"
                        style={{ width: "100%" }}
                      />
                    </td>
                    <td style={{ border: "1px solid #eb631c" }}>
                      <Button
                        variant="link"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSection(section);
                          setAudioTitle(`Section ${section.getIndex() + 1}`);
                          fetchAudio(section.historyItemId);
                        }}
                        style={{ color: "black" }}
                      >
                        <Play color="black" />
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
              {localSectionArray
                .reduce(
                  (acc, section) => acc + section.sectionDurationSeconds,
                  0
                )
                .toFixed(2)}{" "}
              seconds
            </div>
            <div style={{ color: "black" }}>
              Total duration with pauses:{" "}
              {localSectionArray
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
                  variant="link"
                  onClick={(e) => {
                    e.stopPropagation();
                    setForceRenderKey(Math.random().toString());
                    setNowPlayingUrl(combinedVoiceoverUrl);
                    setAudioTitle("Final Cut");
                  }}
                  style={{ color: "white", textDecoration: "none" }}
                >
                  <span
                    style={{
                      verticalAlign: "middle",
                      marginLeft: "8px",
                      color: "black",
                    }}
                  >
                    Replay Final Cut:
                  </span>
                  {/* Assuming Play is an icon component */}
                  <Play
                    color="black"
                    style={{ verticalAlign: "middle", fontSize: "2rem" }}
                  />
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
  );
}

// export default withAuth(StitchSections);
export default StitchSections;

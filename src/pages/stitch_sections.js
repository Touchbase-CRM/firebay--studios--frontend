import React, { useState, useEffect, useRef } from "react";
import useUserInputsStore from "../store/userInputs";
import SimpleAudioPlayer from "../components/SimpleAudioPlayer";
import { getAuth } from "firebase/auth";
import withAuth from "../hocs/withAuth";
import { useRouter } from "next/router";
import axios from "axios";
import Swal from "sweetalert2";

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
import { Play } from "react-bootstrap-icons"; // Ensure you have react-bootstrap-icons installed
import Spinner from "../components/Spinner";

function StitchSections() {
  const auth = getAuth();
  const router = useRouter();
  const {
    sectionsArray,
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

  const musicGenWebServiceUrl =
    "https://vgz580uujk.execute-api.us-east-2.amazonaws.com";
  // const musicGenWebServiceUrl = "http://localhost:8000"; // For local testing
  const cancelTokenSourceRef = useRef(null);

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

  const cardStyle = {
    padding: "20px",
    backgroundColor: "#282c34",
    color: "white",
    marginTop: "10px",
    marginBottom: "10px",
  };

  const tableStyle = {
    width: "100%",
    backgroundColor: "#343a40",
    borderCollapse: "collapse",
  };

  const thTdStyle = {
    padding: "10px",
    borderBottom: "1px solid gray",
  };

  if (pendingAdvertisement) {
    return (
      <div
        className="d-flex align-items-center justify-content-center flex-column"
        style={{ height: "100vh" }}
      >
        <Spinner
          animation="border"
          variant="primary"
          style={{ marginBottom: "200px" }}
        />

        <Card className="p-4 bg-dark text-white" style={{ marginTop: "300px" }}>
          <p
            className="ml-3 mb-0"
            style={{
              fontWeight: "bold",
              fontSize: "24px",
              color: "white",
              textShadow: "1px 1px 1px #000",
            }}
          >
            Just a second. We are stitching the sections together...
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
            variant="warning"
            onClick={cancelAndRetryLoading}
            style={{ width: "200px" }} // Setting the same fixed width
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
          variant="danger"
          size="sm"
          onClick={handleLogout}
          style={{ marginRight: "10px" }}
        >
          Logout
        </Button>
      </Navbar>

      <Card style={{ margin: "20px", backgroundColor: "#2c3034" }}>
        <Card.Body>
          <Card.Title style={{ color: "white" }}>Sections Overview</Card.Title>
          <div
            style={{
              overflowY: "auto",
              maxHeight: "600px",
              overflowX: "hidden",
            }}
          >
            <Table bordered hover variant="dark">
              <thead>
                <tr>
                  <th>Section ID</th>
                  <th>Initial Section</th>
                  <th>Current Section</th>
                  <th>Duration (Seconds)</th>
                  <th>Play</th>
                </tr>
              </thead>
              <tbody>
                {sectionsArray.map((section, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{section.originalContent}</td>
                    <td>{section.currentContent}</td>
                    <td>{section.sectionDurationSeconds.toFixed(2)}</td>
                    <td>
                      <Button
                        variant="link"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSection(section);
                          setAudioTitle(`Section ${section.getIndex() + 1}`);
                          fetchAudio(section.historyItemId);
                        }}
                        style={{ color: "white" }}
                      >
                        <Play color="white" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "20px",
              padding: "10px 20px",
              backgroundColor: "#20262e",
            }}
          >
            <span style={{ color: "white" }}>
              Total of the section durations: {currentTotalDuration.toFixed(2)}{" "}
              seconds
            </span>
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
                  <span style={{ verticalAlign: "middle", marginLeft: "8px" }}>
                    Replay Final Cut:
                  </span>
                  <Play
                    color="white"
                    style={{ verticalAlign: "middle", fontSize: "2rem" }}
                  />
                </Button>
              ) : null}
            </div>
            {/* Other footer contents */}
          </div>
        </Card.Body>
      </Card>

      {combinedVoiceoverUrl === null ? (
        <Button
          variant="success"
          onClick={handleSubmit}
          style={{ margin: "20px", width: "200px" }}
        >
          Finalize the voiceover
        </Button>
      ) : (
        <Button
          variant="primary"
          onClick={handleNext}
          style={{ margin: "20px", width: "200px" }}
        >
          Next
        </Button>
      )}

      <SimpleAudioPlayer
        audioSrc={nowPlayingUrl}
        audioTitle={audioTitle}
        forceRender={forceRenderKey}
        autoplay={true}
      />
    </div>
  );
}

// export default withAuth(StitchSections);
export default StitchSections;

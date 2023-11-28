import React, { useState, useEffect, useRef } from "react";
import { Row, Col, Card, Form, Navbar, Nav, Button } from "react-bootstrap";
import { useRouter } from "next/router";
import firebase from "../firebase";
import "firebase/auth";
import axios from "axios";
import Spinner from "../components/Spinner";
import Swal from "sweetalert2";
import MusicAudioPlayer from "../components/MusicAudioPlayer";
import { getCookie, setCookie, cookieCleaner } from "../utils/cookieUtils";
import withAuth from "../hocs/withAuth";
import { usePostHog } from "posthog-js/react";

function toSnakeCase(str) {
  return str.toLowerCase().replace(/\s+/g, "_");
}

function AddMusic() {
  const posthog = usePostHog();

  const [noMusic, setNoMusic] = useState(() => {
    return getCookie("noMusic", false);
  });
  const [genre, setGenre] = useState(() => {
    return getCookie("genre", "Up Beat");
  });
  const [musicVol, setMusicVol] = useState(() => {
    return getCookie("musicVol", 0.1);
  });
  const [script, setScript] = useState(() => getCookie("script", ""));
  const [voiceId, setVoice] = useState(() => getCookie("voiceId", ""));
  const [pendingAdvertisement, setPendingAdvertisement] = useState(false);
  const router = useRouter();
  const [adLength, setAdLength] = useState(() => getCookie("adLength", ""));
  const [shouldPlay, setShouldPlay] = useState(false);

  const goBack = () => {
    router.back();
  };

  const {
    adLength: adLengthQuery,
    script: scriptQuery,
    voiceId: voiceQuery,
  } = router.query;

  useEffect(() => {
    // Check if all query params are present and not empty
    const hasAdLengthQuery = adLengthQuery && adLengthQuery !== "";
    const hasScriptQuery = scriptQuery && scriptQuery !== "";
    const hasVoiceQuery = voiceQuery && voiceQuery !== "";

    // If all query params are present and not empty, use them to set the state
    if (hasAdLengthQuery && hasScriptQuery && hasVoiceQuery) {
      setAdLength(adLengthQuery);
      setScript(scriptQuery);
      setVoice(voiceQuery);
    } else {
      // Attempt to reassign state from cookies
      const cookieAdLength = getCookie("adLength", "");
      const cookieScript = getCookie("script", "");
      const cookieVoiceId = getCookie("voiceId", "");

      // Check if the cookie values are empty strings
      const areCookiesValid =
        cookieAdLength !== "" && cookieScript !== "" && cookieVoiceId !== "";

      if (!areCookiesValid) {
        // Show SweetAlert2 modal if cookies are invalid
        Swal.fire({
          title: "Session Expired",
          text: "Your session has expired. Please start a new ad.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Start Over",
          cancelButtonText: "Stay",
          reverseButtons: true,
        }).then((result) => {
          if (result.isConfirmed) {
            // User confirmed, clear cookies and redirect
            cookieCleaner(); // Clear all cookies
            router.push("/create_ad"); // Redirect to the create ad page
          }
          // If the user cancels, just close the alert and stay on the page
        });
      } else {
        // If cookies are valid, set the state
        setAdLength(cookieAdLength);
        setScript(cookieScript);
        setVoice(cookieVoiceId);
      }
    }
  }, [adLengthQuery, scriptQuery, voiceQuery, router]);

  // Load states from cookies on component mount
  useEffect(() => {
    // Initialize states from cookies using the getCookie function
    const savedGenre = getCookie("genre", "Up Beat");
    const savedNoMusic = getCookie("noMusic", false);
    const musicVol = getCookie("musicVol", 0.1);

    // Set states
    setGenre(savedGenre);
    setNoMusic(savedNoMusic);
    setMusicVol(musicVol);
  }, []);

  // Save states to cookies whenever they change
  useEffect(() => {
    if (genre) setCookie("genre", genre);
  }, [genre]);
  useEffect(() => {
    if (musicVol) setCookie("musicVol", musicVol);
  }, [musicVol]);

  useEffect(() => {
    // This will set the cookie for both true and false values of noMusic
    setCookie("noMusic", noMusic);
  }, [noMusic]);

  // Cancel token source for the Axios request
  const cancelTokenSourceRef = useRef(null);

  const cancelLoading = () => {
    setShouldPlay(false);
    setPendingAdvertisement(false);
    if (cancelTokenSourceRef.current) {
      cancelTokenSourceRef.current.cancel("Request canceled by the user.");
    }
    Swal.fire({
      icon: "info",
      title: "Submission Cancelled",
      text: 'Your submission has been cancelled. Click "OK" to redirect to the Create Ad page...',
      showConfirmButton: true, // show the confirmation button
      confirmButtonText: "OK",
      allowOutsideClick: false,
    }).then((result) => {
      // If the modal was closed by the confirmation button, redirect.
      if (result.isConfirmed) {
        router.push("/create_ad");
      }
    });
  };

  const cancelAndRetryLoading = () => {
    setShouldPlay(false);
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

  const handleVolumeChange = (event) => {
    const newVolume = event.target.value;
    setMusicVol(newVolume);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setPendingAdvertisement(true); // Set pending before API call starts

    const userId = firebase.auth().currentUser.uid;
    const snakeCaseGenre = toSnakeCase(genre);
    cancelTokenSourceRef.current = axios.CancelToken.source();

    // Track the button click event with PostHog with only the required properties
    posthog.capture("add-music-submit-button-clicked", {
      date: new Date().toISOString(), // Capture the current date and time in ISO format
      userId: userId, // Capture the Firebase user ID
    });

    const payload = {
      user_id: userId,
      no_music: noMusic,
      music_type: snakeCaseGenre,
      script: script,
      voice: voiceId,
      ad_length: adLength,
      music_vol: musicVol,
    };

    // Endpoint URL
    const url =
      "https://vgz580uujk.execute-api.us-east-2.amazonaws.com/generate-mix";
    // const url = "http://localhost:8000/generate-mix"; // For local testing

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

        router.push({
          pathname: "/download",
          query: { audioUrl },
        });
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

  const handleLogout = () => {
    cookieCleaner();
    localStorage.removeItem("user");
    router.push("/login");
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
            Just a second. Your brand fire is being lit...
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
        backgroundColor: "#343a40",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Navbar bg="dark" variant="dark" expand="lg">
        <Navbar.Brand style={{ marginLeft: "10px" }}>
          <img
            src="/fire.png"
            alt="Firebay Studios"
            width="50"
            height="50"
            className="d-inline-block align-top"
          />
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto"></Nav>
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

      <Row>
        <Col md={6} className="mx-auto">
          <Card
            className="p-4 bg-dark text-white"
            style={{ marginTop: "70px", marginBottom: "140px" }}
          >
            <Button
              variant="light"
              onClick={goBack}
              style={{
                marginRight: "10px",
                width: "40px",
                height: "50px",
                marginBottom: "20px",
              }}
            >
              <span style={{ color: "black", fontSize: "24px" }}>&larr;</span>
            </Button>
            <h2 className="mb-4" style={{ marginBottom: "20px" }}>
              Add Background Music
            </h2>
            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="noMusic">
                <Form.Check
                  type="checkbox"
                  label="No Music"
                  checked={noMusic}
                  onChange={() => setNoMusic(!noMusic)}
                />
              </Form.Group>

              <br></br>

              <Form.Group controlId="genre">
                <Form.Label>Genre</Form.Label>
                <Form.Select
                  aria-label="Genre select"
                  value={genre}
                  onChange={(e) => {
                    setGenre(e.target.value);
                    setShouldPlay(true); // Play audio when a genre is selected
                  }}
                  disabled={noMusic}
                  style={{ color: "black" }}
                >
                  <option>Up Beat</option>
                  <option>Happy</option>
                  <option>Jazz</option>
                  <option>Motivational</option>
                  <option>Rock</option>
                </Form.Select>
              </Form.Group>

              {/* <div style={{ marginTop: "20px" }}>
                <label htmlFor="volumeControl" className="form-label">
                  Music Volume Control
                  <i
                    style={{ marginLeft: "5px", color: "white" }}
                    className="bi bi-info-circle"
                    title="Note: The volume selected here will not affect the preview volume."
                  ></i>
                </label>
                <input
                  type="range"
                  className="form-range"
                  min="0"
                  max="1"
                  step="0.01"
                  id="volumeControl"
                  defaultValue={musicVol}
                  onChange={handleVolumeChange}
                  disabled={noMusic}
                />
              </div> */}

              <Button type="submit" className="mt-3">
                Submit
              </Button>
            </Form>
          </Card>
          <div>
            {shouldPlay && (
              <MusicAudioPlayer genre={genre} style={{ marginTop: "20px" }} />
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
}

export default withAuth(AddMusic);

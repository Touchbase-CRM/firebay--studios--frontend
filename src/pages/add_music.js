import React, { useState, useEffect, useRef } from "react";
import {
  Row,
  Col,
  Card,
  Form,
  Navbar,
  Nav,
  Button,
  Spinner as BootstrapSpinner,
} from "react-bootstrap";
import { useRouter } from "next/router";
import { getAuth } from "firebase/auth";
import axios from "axios";
import Spinner from "../components/Spinner";
import Swal from "sweetalert2";
import SimpleAudioPlayer from "../components/SimpleAudioPlayer";
import useUserInputsStore from "../store/userInputs";
import withAuth from "../hocs/withAuth";
import { usePostHog } from "posthog-js/react";
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  query,
  collection,
  where,
} from "firebase/firestore";
import app from "../firebase";

const db = getFirestore(app);

function AddMusic() {
  const baseMusicPreviewsUrl =
    "https://static--files--storage.s3.us-east-2.amazonaws.com/music--previews/";
  const [musicChoices, setMusicChoices] = useState([]); // not included in zustand
  const [pendingAdvertisement, setPendingAdvertisement] = useState(false);
  const [isVolumeLoading, setIsVolumeLoading] = useState(false);
  const [volAdjustedMusicPreview, setVolAdjustedMusicPreview] = useState(null);
  // ... [existing useEffect and functions]
  const router = useRouter();

  const posthog = usePostHog();
  const auth = getAuth();

  // Zustand store hooks
  const {
    chosenMusic,
    setChosenMusic,
    previewFileName,
    setPreviewFileName,
    backgroundMusicFilename,
    setBackgroundMusicFilename,
    musicVol,
    setMusicVol,
    adLength,
    reset,
    historyItemId,
    generatedVoiceUrl,
  } = useUserInputsStore();

  const goBack = () => {
    router.back();
  };

  // Cancel token source for the Axios request
  const cancelTokenSourceRef = useRef(null);

  useEffect(() => {
    const fetchMusicChoices = async () => {
      try {
        const musicChoicesDocRef = doc(
          db,
          "fetch_data_to_frontend",
          "background_music"
        );

        const docSnapshot = await getDoc(musicChoicesDocRef);

        if (docSnapshot.exists()) {
          const musicChoicesData = docSnapshot.data();

          if (musicChoicesData.background_music_choices) {
            setMusicChoices(musicChoicesData.background_music_choices);
          }
        }
      } catch (error) {
        console.error("Error fetching music choices:", error);
      }
    };

    fetchMusicChoices();
  }, []);

  const cancelLoading = () => {
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
        reset(); // Reset the user inputs to default values

        router.push("/create_ad");
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

  const handleVolumeChange = async (event) => {
    const newVolume = event.target.value;
    setMusicVol(newVolume);
    setIsVolumeLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:8000/music_preview_volume_change",
        {
          music_vol: newVolume,
          music_choice: previewFileName,
          user_id: auth.currentUser ? auth.currentUser.uid : "anonymous", // Assuming you want to send the user ID
        },
        {
          responseType: "arraybuffer",
        }
      );

      if (response.data) {
        const audioBlob = new Blob([response.data], { type: "audio/mp3" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setVolAdjustedMusicPreview(audioUrl);
      }
    } catch (error) {
      console.error("Error fetching updated music file:", error);
    } finally {
      setIsVolumeLoading(false);
    }
  };

  const fetchBackgroundMusicMetaData = async (musicChoice) => {
    try {
      const pyroNameQuery = query(
        collection(db, "background_music"),
        where("pyro_name", "==", musicChoice)
      );

      const querySnapshot = await getDocs(pyroNameQuery);

      if (!querySnapshot.empty) {
        const musicFileData = querySnapshot.docs[0].data();

        // have seperate fields for maintainability and bundled this read op for cost optimization
        const backgroundMusicFilename =
          musicFileData.background_music_filename || "";
        const previewFilename = musicFileData.preview_filename || "";

        return {
          backgroundMusicFilename,
          previewFilename,
        };
      } else {
        console.log("No document matches the selected chosenMusic.");
        return {
          backgroundMusicFilename: "",
          previewFilename: "",
        };
      }
    } catch (error) {
      console.error("Error fetching background music metadata:", error);
      return {
        backgroundMusicFilename: "",
        previewFilename: "",
      };
    }
  };

  const handleMusicChange = async (e) => {
    const selectedMusic = e.target.value;
    setChosenMusic(selectedMusic);

    const { backgroundMusicFilename, previewFilename } =
      await fetchBackgroundMusicMetaData(selectedMusic);
    setBackgroundMusicFilename(backgroundMusicFilename);
    setPreviewFileName(previewFilename);
  };
  const handleSkipMusic = () => {
    // Redirect to the download page with the generatedVoiceUrl
    router.push({
      pathname: "/download",
      query: { audioUrl: generatedVoiceUrl },
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(backgroundMusicFilename);
    setPendingAdvertisement(true); // Set pending before API call starts

    const userId = auth.currentUser ? auth.currentUser.uid : "anonymous";
    cancelTokenSourceRef.current = axios.CancelToken.source();

    // Track the button click event with PostHog with only the required properties
    posthog.capture("add-music-submit-button-clicked", {
      date: new Date().toISOString(), // Capture the current date and time in ISO format
      userId: userId, // Capture the Firebase user ID
    });

    const payload = {
      user_id: userId,
      music_choice: backgroundMusicFilename,
      ad_length: adLength,
      history_item_id: historyItemId,
    };

    // Endpoint URL
    // prettier-ignore
    const url ="https://vgz580uujk.execute-api.us-east-2.amazonaws.com/generate-mix"; // For production
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
              {musicChoices.length === 0 ? (
                <div style={{ display: "flex", alignItems: "center" }}>
                  <Form.Select
                    aria-label="Music selection"
                    disabled
                    style={{ color: "black" }}
                  >
                    <option>Loading music choices...</option>
                  </Form.Select>
                  <BootstrapSpinner
                    animation="border"
                    style={{ marginLeft: "10px" }}
                  />
                </div>
              ) : (
                <Form.Select
                  aria-label="Music selection"
                  value={chosenMusic}
                  onChange={handleMusicChange}
                  style={{ color: "black" }}
                >
                  {musicChoices.map((musicOption, index) => (
                    <option key={index} value={musicOption}>
                      {musicOption}
                    </option>
                  ))}
                </Form.Select>
              )}

              {
                <div style={{ marginTop: "20px" }}>
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
                    onMouseUp={handleVolumeChange} // triggered when the mouse button is released
                    onTouchEnd={handleVolumeChange} // triggered when the touch is ended
                    disabled={isVolumeLoading}
                  />
                </div>
              }

              <Button type="submit" className="mt-3">
                Submit
              </Button>
              <Button
                variant="danger"
                onClick={handleSkipMusic}
                style={{
                  position: "absolute",
                  bottom: "20px",
                  right: "20px",
                }} // Adjust position as needed
              >
                Skip Music
              </Button>
            </Form>
          </Card>

          <div>
            <SimpleAudioPlayer
              audioTitle={chosenMusic}
              audioSrc={
                volAdjustedMusicPreview ||
                baseMusicPreviewsUrl + previewFileName
              }
            />
          </div>
        </Col>
      </Row>
    </div>
  );
}

export default withAuth(AddMusic);
//another line

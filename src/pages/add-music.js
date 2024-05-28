import React, { useState, useEffect, useRef } from "react";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Spinner as BootstrapSpinner,
} from "react-bootstrap";
import { NavBar } from "@/components/foundation-components/nav-bar";
import SliderComponent from "@/components/foundation-components/slider";

import { SecondaryActionButton } from "@/components/buttons/secondary-action-button";

import "bootstrap-icons/font/bootstrap-icons.css";

import { useRouter } from "next/router";
import { getAuth } from "firebase/auth";
import axios from "axios";
import Spinner from "../components/spinner/spinner";
import Swal from "sweetalert2";
import SimpleAudioPlayer from "../components/simple-audio-player";
import BackButton from "@/components/buttons/back-button";
import useUserInputsStore from "@/store/user-inputs";
import withAuth from "@/hocs/with-auth";
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
import app from "@/firebase";
import { Stack } from "../data-structures/stack";
import { updateExistingSpotInDb } from "@/utils/db-read-write-ops/serialization-utils";
import { set } from "lodash";

const db = getFirestore(app);

function AddMusic() {
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
    sectionsArray,
    stitchedAudioPyroHistoryItemId,
    adGenerationMethod,
    spotId,
  } = useUserInputsStore();

  const saveFeatureSpecificStates = {
    stitchedAudioPyroHistoryItemId,
    historyItemId,
  };

  const saveSharedStates = {
    chosenMusic,
    previewFileName,
    backgroundMusicFilename,
    musicVol,
    adGenerationMethod,
    spotId,
    adLength,
  };

  const baseMusicPreviewsUrl =
    "https://static--files--storage.s3.us-east-2.amazonaws.com/music--previews--low--vol/";
  const [musicChoices, setMusicChoices] = useState([]); // not included in zustand
  const [pendingAdvertisement, setPendingAdvertisement] = useState(false);
  const [volAdjustedMusicPreview, setVolAdjustedMusicPreview] = useState(null);
  const [localStack, setLocalStack] = useState(() => new Stack());
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);

  const syncStackWithGlobal = useUserInputsStore(
    (state) => state.setNavigationStack
  );

  const router = useRouter();

  const posthog = usePostHog();
  const auth = getAuth();
  const defaultVolume = 10; // 10%
  const previousChosenMusic = useRef(chosenMusic);

  // prettier-ignore
  const audioStitchWebServiceUrl = process.env.NODE_ENV === "development"
  ? "http://localhost:8000"
  : "https://vgz580uujk.execute-api.us-east-2.amazonaws.com";

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

  const handleGoBack = () => {
    // save the current url in the stack
    localPushData(`/advanced-mode/script-to-ad/stitch-sections`);
    syncLocalStackWithGlobal();
    handleSaveState();
    // move to the new url
    if (sectionsArray.length > 0) {
      router.push("/advanced-mode/script-to-ad/stitch-sections");
    } else if (adGenerationMethod === "voice-to-ad") {
      router.push("/quick-mode/voice-to-ad/create-ad");
    } else {
      router.push("/quick-mode/script-to-ad/create-ad");
    }
  };

  // Cancel token source for the Axios request
  const cancelTokenSourceRef = useRef(null);

  useEffect(() => {
    if (previousChosenMusic.current !== chosenMusic) {
      // Reset volume only if the music choice has actually changed
      setMusicVol(defaultVolume);
      setVolAdjustedMusicPreview(null);

      previousChosenMusic.current = chosenMusic; // Update the ref to the current music choice
    }
  }, [chosenMusic]);

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

        router.push("/quick-mode/script-to-ad/create-ad");
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

  const handleVolumeChange = async (newVolume) => {
    try {
      const response = await axios.post(
        `${audioStitchWebServiceUrl}/music_preview_volume_change`,
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
    }
    setShowAudioPlayer(true);
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

        // have separate fields for maintainability and bundled this read op for cost optimization
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
    setShowAudioPlayer(true);
    setChosenMusic(selectedMusic);

    const { backgroundMusicFilename, previewFilename } =
      await fetchBackgroundMusicMetaData(selectedMusic);
    setBackgroundMusicFilename(backgroundMusicFilename);
    setPreviewFileName(previewFilename);
  };

  const handleSkipMusic = () => {
    const userId = auth.currentUser ? auth.currentUser.uid : "anonymous";
    handleSaveState();
    // Redirect to the download page with the generatedVoiceUrl
    router.push({
      pathname: "/download",
      query: { audioUrl: generatedVoiceUrl },
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setPendingAdvertisement(true); // Set pending before API call starts

    const userId = auth.currentUser ? auth.currentUser.uid : "anonymous";
    cancelTokenSourceRef.current = axios.CancelToken.source();

    // Track the button click event with PostHog with only the required properties
    if (process.env.NODE_ENV !== "development") {
      posthog.capture("add-music-submit-button-clicked", {
        userId: userId, // Capture the Firebase user ID
        userEmail: auth.currentUser ? auth.currentUser.email : "anonymous", // Capture the user's email
        music_choice: backgroundMusicFilename,
        history_item_id: historyItemId
          ? historyItemId
          : stitchedAudioPyroHistoryItemId,
      });
    }

    let payload;

    if (stitchedAudioPyroHistoryItemId !== "") {
      payload = {
        user_id: userId,
        music_choice: backgroundMusicFilename,
        ad_length: adLength,
        music_vol: musicVol / 100,
        pyro_history_item_id: stitchedAudioPyroHistoryItemId,
      };
    } else {
      payload = {
        user_id: userId,
        music_choice: backgroundMusicFilename,
        ad_length: adLength,
        music_vol: musicVol / 100,
        history_item_id: historyItemId,
      };
    }

    // Endpoint URL
    // prettier-ignore
    const url =`${audioStitchWebServiceUrl}/generate-mix`;
    // Send POST request to the API
    axios
      .post(url, payload, {
        responseType: "arraybuffer",
        cancelToken: cancelTokenSourceRef.current.token, // Using the token from useRef
      })
      .then(async (response) => {
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
        handleSaveState();
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

  const getMode = () => {
    if (adGenerationMethod === "script-to-ad") {
      return historyItemId ? "advanced-script-to-ad" : "quick-script-to-ad";
    }

    if (adGenerationMethod === "voice-to-ad") {
      return "quick-voice-to-ad";
    }
  };

  const handleSaveState = () => {
    const mode = getMode();
    updateExistingSpotInDb({
      spotId: spotId,
      mode: mode,
      modeSpecificStates: saveFeatureSpecificStates,
      sharedStates: saveSharedStates,
    });
  };

  const links = [
    {
      label: "Home",
      url: "/home",
      isInternal: true,
      icon: "bi bi-house", // Bootstrap icon class
      style: { marginRight: "10px" }, // Example styling
    },
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
      <NavBar
        links={links}
        logoutHandler={handleLogout}
        saveHandler={handleSaveState}
      />

      <Row>
        <Col md={6} className="mx-auto">
          <div style={{ position: "relative" }}>
            <Card
              className="p-4"
              style={{
                marginTop: "70px",
                marginBottom: "20px",
                borderRadius: "1rem",
                borderColor: "#eb631c",
                color: "black",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute", // Absolutely position the BackButton
                  top: "10px", // Adjust as needed
                  left: "10px", // Adjust as needed
                }}
              >
                <BackButton
                  width="30px"
                  height="30px"
                  backgroundColor="#eb631c"
                  onClick={handleGoBack} // Pass the onClick method directly
                />
              </div>
              <h2
                className="mb-4"
                style={{ marginBottom: "20px", marginTop: "30px" }}
              >
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
                    style={{ color: "black", width: "100%" }}
                  >
                    {musicChoices.map((musicOption, index) => (
                      <option key={index} value={musicOption}>
                        {musicOption}
                      </option>
                    ))}
                  </Form.Select>
                )}

                {
                  <div style={{ marginTop: "20px", marginBottom: "20px" }}>
                    <label htmlFor="volumeControl" className="form-label">
                      Music Volume Control
                    </label>
                    <SliderComponent
                      min={0}
                      max={100}
                      value={musicVol}
                      onValueChange={(value) => {
                        setMusicVol(value);
                        handleVolumeChange(value / 100);
                      }}
                      thumbColor="#eb631c"
                      trackColor="#f0f0f0"
                      fillColor="#eb631c"
                      showPercentage={true}
                      disabled={false}
                      width="70%"
                      height="10px"
                      containerStyle={{
                        position: "absolute",
                        top: "210px",
                        left: "22px",
                      }}
                    />
                  </div>
                }

                <Button
                  type="submit"
                  className="mt-3"
                  style={{ backgroundColor: "#eb631c", borderColor: "#eb631c" }}
                >
                  Submit
                </Button>
                <Button
                  // variant="danger"
                  onClick={handleSkipMusic}
                  style={{
                    position: "absolute",
                    bottom: "20px",
                    right: "20px",
                    backgroundColor: "#FDA942",
                    borderColor: "#FDA942",
                  }}
                >
                  Skip Music
                </Button>
              </Form>
            </Card>
            <div style={{ textAlign: "right" }}>
              {/* Save Button */}
              <SecondaryActionButton
                initialText="Save"
                clickedText="Saved!"
                borderColor="#FDA942"
                onClick={handleSaveState}
              />
            </div>
          </div>
          <div>
            {showAudioPlayer && (
              <SimpleAudioPlayer
                audioTitle={chosenMusic}
                audioSrc={
                  volAdjustedMusicPreview ||
                  baseMusicPreviewsUrl + previewFileName
                }
              />
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
}

export default withAuth(AddMusic);

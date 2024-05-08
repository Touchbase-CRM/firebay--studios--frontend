// relative path: src/pages/speech_style_transfer.js
import React, { useState, useCallback, useRef, useEffect } from "react";
import { Row, Col, Card, Form, Button, Spinner } from "react-bootstrap";
import { elevenlabsSTS } from "@/middleware/speechToSpeech";
import SimpleAudioPlayer from "../../../components/simple-audio-player";
import { useFileUploader } from "@/hooks/fileUpload/useFileUploader";
import { ViewUploadedAudio } from "@/components/view-uploaded-audio/uploadedAudio";
import Swal from "sweetalert2";
import { AudioRecorder } from "react-audio-voice-recorder";
import { NavBar } from "@/components/nav-bar";
import { useRouter } from "next/router";
import { createSpotInDb } from "@/utils/dbReadWriteOps/serializationUtils";

import useUserInputsStore from "../../../store/userInputs";

import withAuth from "@/hocs/withAuth";
import { getAuth } from "firebase/auth";
import app from "../../../firebase";

import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  query,
  collection,
  where,
} from "firebase/firestore";

import { usePostHog } from "posthog-js/react";

async function getAudioDuration(blob) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  return audioBuffer.duration;
}

function CreateAd() {
  const posthog = usePostHog();
  const auth = getAuth();
  const router = useRouter();
  const voiceAudioPlayerRef = useRef(null);

  // Zustand store hooks
  const {
    // shared states
    spotId,
    voiceId,
    setVoiceId,
    voiceName,
    setVoiceName,
    voicePreviewFilename,
    setVoicePreviewFilename,
    adLength,
    setAdLength,
    generatedVoiceUrl,
    setGeneratedVoiceUrl,
    historyItemId,
    setHistoryItemId,
    modelId,
    setModelId,
    setAdGenerationMethod,
    // V2a states
    v2aUploadedAudioUrl,
    setV2aUploadedAudioUrl,
    v2aQuickUploadedFile,
    setV2aQuickUploadedFile,
    v2aQuickGeneratedAudioBlob,
    setv2aQuickGeneratedAudioBlob,
    v2aQuickAudioDuration,
    setV2aQuickAudioDuration,
  } = useUserInputsStore();

  const saveFeatureSpecificStates = {
    historyItemId,
    v2aUploadedAudioUrl,
    v2aQuickUploadedFile,
    v2aQuickGeneratedAudioBlob,
    v2aQuickAudioDuration,
  };

  const saveSharedStates = {
    voiceId,
    voiceName,
    voicePreviewFilename,
    adLength,
    generatedVoiceUrl,
    modelId,
    spotId,
  };

  const [voiceOptions, setVoiceOptions] = useState([]);
  const [isFormSubmitted, setFormSubmitted] = useState(false);
  const restrictedVoices = ["Evan (Cloned)"];

  const CHACRACTEROVERFLOWTHRESHOLD = 15; // This is the threshold we will use to avoid overflow
  const CHARACTERSPERSEC = 15.2; // Experimentally determined characters per second

  var charLimit = Math.round(parseInt(adLength) * CHARACTERSPERSEC); // Calculate character limit based on the ad length
  charLimit = charLimit - CHACRACTEROVERFLOWTHRESHOLD; // substracting a threshold to avoid overflow

  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [forceRenderKey, setForceRenderKey] = useState(0);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [audioTitle, setAudioTitle] = useState("");
  const [audioAutoPlay, setAudioAutoPlay] = useState(false);

  useEffect(() => {
    setAdGenerationMethod("voice-to-ad");
  }, []);

  useEffect(() => {
    if (isFormSubmitted) {
      router.push("/add-music");
    }
  }, [isFormSubmitted, router]);

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

  useEffect(() => {
    const fetchVoiceOptions = async () => {
      const voicesDocRef = doc(
        getFirestore(app),
        "fetch_data_to_frontend",
        "pyro_voices"
      );
      try {
        const docSnapshot = await getDoc(voicesDocRef);
        if (docSnapshot.exists()) {
          setVoiceOptions(docSnapshot.data().pyro_voice_choices);
        } else {
          console.log("No voice options found in document");
        }
      } catch (error) {
        console.error("Error fetching voice options:", error);
      }
    };

    fetchVoiceOptions();
  }, []);

  const baseVoicePreviewsUrl =
    "https://static--files--storage.s3.us-east-2.amazonaws.com/voice--previews/";

  const fetchVoiceMetaData = async (voiceName) => {
    const db = getFirestore(app);
    const voiceQuery = query(
      collection(db, "pyro_voices"),
      where("pyro_name", "==", voiceName)
    );

    try {
      const querySnapshot = await getDocs(voiceQuery);
      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0].data();
        return {
          newVoiceId: docData.elevenlabs_id,
          newVoicePreviewFilename: docData.voice_preview_filename,
          newVoiceModelId: docData.model_id,
        };
      } else {
        console.log("No matching documents found for voice:", voiceName);
        return {}; // Return an empty object instead of null
      }
    } catch (error) {
      console.error("Error fetching voice metadata:", error);
      return {}; // Return an empty object in case of error
    }
  };

  const handleVoiceChange = async (e) => {
    const selectedVoiceName = e.target.value;
    const metadata = await fetchVoiceMetaData(selectedVoiceName);

    if (
      metadata &&
      metadata.newVoiceId &&
      metadata.newVoicePreviewFilename &&
      metadata.newVoiceModelId
    ) {
      setVoiceId(metadata.newVoiceId);
      setVoicePreviewFilename(metadata.newVoicePreviewFilename);
      setVoiceName(selectedVoiceName);
      setModelId(metadata.newVoiceModelId);

      // Reset the generatedVoiceUrl to force the audio player to use the new voice preview
      setGeneratedVoiceUrl(""); // This line is added to reset the URL
    } else {
      // Handle the case when no metadata is found
      console.log(
        "No metadata found for the selected voice:",
        selectedVoiceName
      );
    }

    // Assuming you want to play the new voice preview immediately
    if (metadata.newVoicePreviewFilename) {
      const previewUrl =
        baseVoicePreviewsUrl + metadata.newVoicePreviewFilename;
      setShowAudioPlayer(true);
      setAudioAutoPlay(true);
      if (voiceAudioPlayerRef.current) {
        voiceAudioPlayerRef.current.src = previewUrl;
        voiceAudioPlayerRef.current.load();
        voiceAudioPlayerRef.current.play();
      }
    }
  };

  const processInputAudio = useCallback(
    async (blob, fileName = "AddedAudio.mp3") => {
      try {
        const duration = await getAudioDuration(blob);
        const adLengthInSeconds = parseInt(adLength);

        if (duration > adLengthInSeconds) {
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "The audio is too long compared to the selected ad length. Please re-add the audio, or adjust the ad length.",
          });
          return;
        }

        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        setv2aQuickGeneratedAudioBlob(blob); // Store the Blob for later use
        setV2aQuickAudioDuration(
          `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
        );
        setV2aQuickUploadedFile({
          name: fileName.slice(0, 40), // This will keep only the first 20 characters of the fileName
          size: (blob.size / 1024 / 1024).toFixed(2) + " MB",
        });

        const fileUrl = URL.createObjectURL(blob);
        setShowAudioPlayer(false);
        setGeneratedVoiceUrl(fileUrl);
        setV2aUploadedAudioUrl(fileUrl);
      } catch (error) {
        console.error("Error processing audio file: ", error);
        setV2aQuickAudioDuration("Unknown");
      }
    },
    [adLength]
  );

  const handleGenerateVoice = async () => {
    if (!v2aQuickUploadedFile) return;
    setIsGeneratingVoice(true);

    try {
      // voiceId and modelId need to be defined or selected by the user in your UI
      const modelId = "eleven_multilingual_sts_v2"; // @TODO: Replace with the desired model ID if we need to use a different model.

      // Call your API function with the necessary parameters
      const result = await elevenlabsSTS(
        v2aQuickGeneratedAudioBlob,
        voiceId,
        modelId
      );

      if (result && result.audioUrl) {
        const localHistoryItemId = result.localHistoryItemId;
        setHistoryItemId(localHistoryItemId);
        setGeneratedVoiceUrl(result.audioUrl);
        setShowAudioPlayer(true); // Show the audio player with the new generated voice
        setAudioTitle(voiceName);
        setAudioAutoPlay(true);
        posthog.capture("quick-mode--voice-to-ad--create-ad-voice-generated", {
          userId: auth.currentUser ? auth.currentUser.uid : "anonymous",
          voiceId: voiceId,
          historyItemId: localHistoryItemId,
        });
      } else {
        console.error("API did not return an audio URL.");
      }
    } catch (error) {
      console.error("Error generating voice:", error);
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  const saveAudioUploads = async (bucketName, objectKey, audioBlob) => {
    try {
      // Convert Blob to Base64 to send as JSON
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64data = reader.result;
        // Strip off the MIME type: data:audio/mpeg;base64,
        const base64WithoutPrefix = base64data.split(",")[1];

        const response = await fetch("/api/S3/uploadAudio", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file: base64WithoutPrefix,
            bucketName: bucketName,
            objectName: objectKey,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          console.log("File uploaded successfully");
        } else {
          console.error("Failed to upload file:", data.message);
        }
      };
    } catch (error) {
      console.error("Error preparing the audio file for upload:", error);
    }
  };

  const handleSaveState = () => {
    saveAudioUploads(
      "workingdir--storage",
      `save--files/${v2aQuickUploadedFile.name}`,
      v2aQuickGeneratedAudioBlob
    );

    createSpotInDb({
      spotName: null, // explicitly setting it as null for clarity, optional
      spotId: spotId,
      mode: "quick-voice-to-ad",
      modeSpecificStates: saveFeatureSpecificStates,
      sharedStates: saveSharedStates,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!historyItemId) {
      showAlert(
        "info",
        "Action Required",
        "Please generate the voice audio before proceeding further."
      );
      return;
    }

    handleSaveState();
    // route to add_music page
    router.push("/add-music");
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

  const handleFileUpload = useCallback(
    (file) => {
      processInputAudio(file, file.name);
    },
    [processInputAudio]
  );

  const { openFileSelector } = useFileUploader(handleFileUpload);

  const handleRemoveAudio = () => {
    setV2aQuickUploadedFile(null);
    setV2aQuickAudioDuration("00:00");
    setV2aUploadedAudioUrl("");
    setShowAudioPlayer(false);
  };

  const handleUploadPlay = () => {
    setAudioAutoPlay(true);

    setForceRenderKey(Math.random());
    setAudioTitle(v2aQuickUploadedFile.name);
    setGeneratedVoiceUrl(v2aUploadedAudioUrl);
    setShowAudioPlayer(true);
  };

  const handleRecordingComplete = (blob) => {
    setv2aQuickGeneratedAudioBlob(blob);
    processInputAudio(blob);
  };

  const parseDurationToSeconds = (duration) => {
    const [minutes, seconds] = duration.split(":").map(Number);
    return minutes * 60 + seconds;
  };

  const links = [
    {
      label: "Dashboard",
      url: "/dashboard",
      isInternal: true,
      icon: "bi bi-house", // Bootstrap icon class
      style: { marginRight: "10px" }, // Example styling
    },
  ];

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
      <Row>
        <Col md={10} className="mx-auto">
          <Card
            className="p-4 "
            style={{
              borderRadius: "1rem",
              borderColor: "#eb631c",
              color: "black",
              marginTop: "10px",
              height: "250px",
              marginBottom: "10px",
            }}
          >
            <Card.Title>Voice Editor</Card.Title>
            <Form>
              <Form.Group controlId="adLength">
                <Form.Label>Choose Ad Length</Form.Label>
                <Form.Select
                  aria-label="Ad length select"
                  value={adLength}
                  onChange={(e) => setAdLength(e.target.value)}
                  style={{ color: "black", marginBottom: "20px" }}
                >
                  {[10, 15, 30, 45, 60]
                    .filter(
                      (length) =>
                        length >= parseDurationToSeconds(v2aQuickAudioDuration)
                    )
                    .map((length) => (
                      <option key={length} value={length}>
                        {length} seconds
                      </option>
                    ))}
                </Form.Select>
              </Form.Group>

              <Form.Group controlId="voice">
                <Form.Label>Voice</Form.Label>
                {voiceOptions.length === 0 ? (
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <Form.Select
                      aria-label="Voice select"
                      disabled
                      style={{ color: "black" }}
                    >
                      <option>Loading voice choices...</option>
                    </Form.Select>
                    <Spinner
                      animation="border"
                      style={{ marginLeft: "10px" }}
                    />
                  </div>
                ) : (
                  <Form.Select
                    aria-label="Voice select"
                    value={voiceName} // Retains the current voice name
                    onChange={handleVoiceChange}
                    style={{ color: "black" }}
                  >
                    {voiceOptions
                      // These restrictions are temporary. Need to figure out a better data model.
                      .filter((voice) => {
                        const isRestrictedVoice =
                          restrictedVoices.includes(voice);
                        const isFirebayStudiosEmail =
                          auth.currentUser.email.split("@")[1] ===
                          "firebaystudios.com";
                        return (
                          !isRestrictedVoice ||
                          (isRestrictedVoice && isFirebayStudiosEmail)
                        );
                      })
                      .map((voice, index) => (
                        <option key={voice} value={voice}>
                          {voice}
                        </option>
                      ))}
                  </Form.Select>
                )}
              </Form.Group>
            </Form>
          </Card>
        </Col>
      </Row>
      <Row>
        <Col md={10} className="mx-auto">
          <Card
            className="p-4"
            style={{
              // backgroundColor: "black",
              borderRadius: "1rem",
              borderColor: "#eb631c",
              color: "black",
              marginTop: "10px",
              height: "550px",
              marginBottom: "10px",
            }}
          >
            <Card.Body>
              <Card.Title>Add Your Voice</Card.Title>

              <div
                style={{
                  backgroundColor: "#fff3cd", // A light yellow typically used for warning alerts
                  borderLeft: "4px solid #ffecb5", // A darker yellow border on the left for emphasis
                  color: "#856404", // Dark text for contrast
                  padding: "20px", // Uniform padding
                  borderRadius: "5px", // Rounded corners
                  marginBottom: "20px", // Space below the alert
                  fontWeight: "bold", // Bold text for emphasis
                  textAlign: "center", // Centered text
                  fontSize: "16px", // Base font size for readability
                }}
              >
                Generate an ad read by combining the style and content of an
                audio file you record or upload with a voice of your choice.
                <br />
                <span
                  style={{
                    display: "inline-block", // Block-like behavior for background coloring
                    backgroundColor: "#fffae6", // A very light yellow for emphasis
                    marginTop: "10px", // Space from the previous line
                    padding: "5px 0", // Padding top and bottom
                    borderRadius: "5px", // Rounded corners for the highlight
                    textDecoration: "underline", // Underline for emphasis
                    fontWeight: "bold", // Bold text for visibility
                    color: "#665c33", // Slightly darker text for contrast
                  }}
                >
                  Recorded or uploaded audio must not exceed the ad length you
                  have chosen above.
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <AudioRecorder
                  onRecordingComplete={handleRecordingComplete}
                  audioTrackConstraints={{
                    noiseSuppression: true,
                    echoCancellation: true,
                  }}
                  onNotAllowedOrFound={(err) => console.error(err)}
                  downloadOnSavePress={false}
                  downloadFileExtension="mp3"
                  showVisualizer={true}
                  mediaRecorderOptions={{
                    audioBitsPerSecond: 128000,
                  }}
                />
                <br />
                <Button
                  onClick={openFileSelector}
                  style={{
                    width: "48%", // Using percentage to utilize the space
                    height: "48px",
                    borderColor: "#eb631c",
                    color: "#eb631c",
                    backgroundColor: "transparent",
                    marginTop: "10px",
                    marginBottom: "10px",
                  }}
                >
                  <i
                    className="bi bi-upload"
                    style={{
                      marginRight: "5px",
                      color: "#EB631C",
                      fontSize: "24px",
                    }}
                  ></i>
                  Upload Audio File
                </Button>
              </div>

              <div
                style={{
                  backgroundColor: "#e4e4e4",
                  padding: "10px",
                  borderRadius: "5px",
                  marginTop: "10px",
                  height: "150px",
                }}
              >
                {v2aQuickUploadedFile && (
                  <ViewUploadedAudio
                    fileName={v2aQuickUploadedFile.name}
                    fileSize={v2aQuickUploadedFile.size} // Will display "Unknown", or you can attempt to calculate this if necessary
                    fileLength={v2aQuickAudioDuration}
                    onPlay={handleUploadPlay}
                    onRemove={handleRemoveAudio}
                  />
                )}
              </div>
            </Card.Body>
            {/* Position the Generate Voice button at the bottom right of the card */}
            <Button
              onClick={handleGenerateVoice}
              disabled={isGeneratingVoice} // Disable button when audio is being generated
              style={{
                position: "absolute",
                bottom: "10px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "60%",
                backgroundColor: "#EB631C",
                borderColor: "#EB631C",
              }}
            >
              {isGeneratingVoice ? (
                <span>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                  />{" "}
                  Generating...
                </span>
              ) : (
                "Generate Voice"
              )}
            </Button>
          </Card>
          {historyItemId && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between", // Ensures the buttons are on opposite sides
                marginTop: "20px", // Adjusted margin for overall alignment
              }}
            >
              {/* Next Button */}
              <Button
                className="mt-3"
                style={{
                  backgroundColor: "#EB631C",
                  borderColor: "#EB631C",
                }}
                onClick={handleSubmit}
              >
                Next
              </Button>
              {/* Save Button */}
              <Button
                className="mt-3"
                onClick={handleSaveState}
                style={{
                  backgroundColor: "white",
                  borderColor: "#FDA942",
                  color: "black",
                }}
              >
                Save
              </Button>
            </div>
          )}
          {/* By adding a massive margin top I was able to add the scrollability to mac OS */}
          <div style={{ position: "relative", marginTop: "400px" }}>
            {showAudioPlayer && (
              <SimpleAudioPlayer
                audioSrc={
                  generatedVoiceUrl ||
                  baseVoicePreviewsUrl + voicePreviewFilename
                }
                audioTitle={voiceName}
                allowDownload={generatedVoiceUrl !== ""}
                autoplay={audioAutoPlay}
              />
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
}
export default withAuth(CreateAd);

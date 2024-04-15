// relative path: src/pages/speech_style_transfer.js
import React, { useState, useCallback, useRef } from "react";
import { Row, Col, Card, Form, Button, Spinner } from "react-bootstrap";
import { elevenlabsSTS } from "@/middleware/speechToSpeech";
import SimpleAudioPlayer from "../../../components/SimpleAudioPlayer";
import { useFileUploader } from "@/hooks/fileUpload/useFileUploader";
import { ViewUploadedAudio } from "@/components/viewUploadedAudio/uploadedAudio";
import Swal from "sweetalert2";
import { AudioRecorder } from "react-audio-voice-recorder";
import { NavBar } from "@/components/navBar";

async function getAudioDuration(blob) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  return audioBuffer.duration;
}

function userSpeech() {
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [generatedVoiceUrl, setGeneratedVoiceUrl] = useState("");
  const [adLength, setAdLength] = useState("30");
  const [voiceId, setVoiceId] = useState("6wLJ4Wm2OxvAvetEUBCS");
  const [uploadedFile, setUploadedFile] = useState("");
  const [audioDuration, setAudioDuration] = useState("00:00");
  const [forceRenderKey, setForceRenderKey] = useState(0);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);

  const voices = {
    Charley: "6wLJ4Wm2OxvAvetEUBCS",
    Kate: "cBijDV6IOSWp9c8dA7Xn",
  };
  const [voiceName, setVoiceName] = useState("Charley");
  const [audioTitle, setAudioTitle] = useState("");

  // Convert voices object to an array for rendering in the form select
  const voiceOptions = Object.entries(voices).map(([name, id]) => ({
    name: name,
    id: id,
  }));

  const baseVoicePreviewsUrl =
    "https://static--files--storage.s3.us-east-2.amazonaws.com/voice--previews/";

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
        setAudioBlob(blob); // Store the Blob for later use
        setAudioDuration(`${minutes}:${seconds < 10 ? "0" : ""}${seconds}`);
        setUploadedFile({
          name: fileName.slice(0, 40), // This will keep only the first 20 characters of the fileName
          size: (blob.size / 1024 / 1024).toFixed(2) + " MB",
        });

        const fileUrl = URL.createObjectURL(blob);
        setShowAudioPlayer(false);
        setGeneratedVoiceUrl(fileUrl);
      } catch (error) {
        console.error("Error processing audio file: ", error);
        setAudioDuration("Unknown");
      }
    },
    [adLength]
  );

  const handleGenerateVoice = async () => {
    if (!uploadedFile) return;
    setIsGeneratingVoice(true);

    try {
      // voiceId and modelId need to be defined or selected by the user in your UI
      const modelId = "eleven_english_sts_v2"; // Should be set based on your application logic or user's selection

      // Call your API function with the necessary parameters
      const result = await elevenlabsSTS(audioBlob, voiceId, modelId);

      if (result && result.audioUrl) {
        setGeneratedVoiceUrl(result.audioUrl);
        setShowAudioPlayer(true); // Show the audio player with the new generated voice
        setAudioTitle(voiceName);
      } else {
        console.error("API did not return an audio URL.");
      }
    } catch (error) {
      console.error("Error generating voice:", error);
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  const handleVoiceChange = (e) => {
    // Only for demo purposes.
    const selectedVoiceId = e.target.value;
    const selectedVoiceName = Object.keys(voices).find(
      (name) => voices[name] === selectedVoiceId
    );
    setVoiceName(selectedVoiceName);
    setVoiceId(selectedVoiceId);
  };

  const handleFileUpload = useCallback(
    (file) => {
      processInputAudio(file, file.name);
    },
    [processInputAudio]
  );

  const { openFileSelector } = useFileUploader(handleFileUpload);

  const handleRemoveAudio = () => {
    setUploadedFile(null);
    setAudioDuration("00:00");
    setShowAudioPlayer(false);
  };

  const handleUploadPlay = () => {
    setForceRenderKey(Math.random());
    setAudioTitle(uploadedFile.name);
    setShowAudioPlayer(true);
  };

  const handleRecordingComplete = (blob) => {
    setAudioBlob(blob);
    processInputAudio(blob);
  };

  const dropdownItems = [];

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <NavBar links={[]} dropdownItems={dropdownItems} />
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
                  <option value="30">30 seconds</option>
                  <option value="60">60 seconds</option>
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
                    value={voiceId} // Change to use voiceId for the value
                    onChange={handleVoiceChange}
                    style={{ color: "black" }}
                  >
                    {voiceOptions.map((voice, index) => (
                      <option key={index} value={voice.id}>
                        {voice.name}
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
              <Card.Title>Voice to Ad Generator</Card.Title>

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
                {uploadedFile && (
                  <ViewUploadedAudio
                    fileName={uploadedFile.name}
                    fileSize={uploadedFile.size} // Will display "Unknown", or you can attempt to calculate this if necessary
                    fileLength={audioDuration}
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
          <div
            style={{
              // position: "absolute",
              // bottom: "10px",
              // left: "10px",
              fontSize: "small",
              fontWeight: "bold",
              fontStyle: "italic",
            }}
          ></div>
          {/* By adding a massive margin top I was able to add the scrollability to mac OS */}
          <div style={{ position: "relative", marginTop: "400px" }}>
            {showAudioPlayer && (
              <SimpleAudioPlayer
                key={forceRenderKey} // Corrected from forceRender to key
                audioSrc={generatedVoiceUrl}
                audioTitle={audioTitle}
                allowDownload={!!generatedVoiceUrl} // This will return true or false based on the truthiness of generatedVoiceUrl
                autoplay={true}
              />
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
}
export default userSpeech;

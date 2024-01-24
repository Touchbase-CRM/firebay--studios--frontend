import React, { useState } from "react";
import useUserInputsStore from "../store/userInputs";
import SimpleAudioPlayer from "../components/SimpleAudioPlayer";
import { Button, Card, Row, Col } from "react-bootstrap";
import { Play } from "react-bootstrap-icons"; // Ensure you have react-bootstrap-icons installed
import Spinner from "../components/Spinner";

function StitchSections() {
  const { sectionsArray } = useUserInputsStore();

  const [audioUrl, setAudioUrl] = useState("");
  const [selectedSection, setSelectedSection] = useState(null);
  const [pendingAdvertisement, setPendingAdvertisement] = useState(false);

  const handleSectionClick = (section) => {
    setSelectedSection(section);
  };

  const fetchAudio = (historyItemId) => {
    console.log(historyItemId);
    console.log(sectionsArray);
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
        // setAudioTitle(`Section ${historyItemId}`);
      })
      .catch((err) => console.error(err));
  };

  const currentTotalDuration = sectionsArray.reduce(
    (acc, section) => acc + section.sectionDurationSeconds,
    0
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    setPendingAdvertisement(true);
  };

  const cancelLoading = () => {
    setPendingAdvertisement(false);
  };

  const cancelAndRetryLoading = () => {
    setPendingAdvertisement(false);
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
            Just a second. We are stitching the sections together (This page is
            under construction. Please come back later...)
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
        padding: "20px",
      }}
    >
      <div style={cardStyle}>
        <h1 style={{ color: "white" }}>Sections Overview</h1>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thTdStyle}>Section ID</th>
              <th style={thTdStyle}>Initial Section</th>
              <th style={thTdStyle}>Current Section</th>
              <th style={thTdStyle}>Duration (Seconds)</th>
            </tr>
          </thead>
          <tbody>
            {sectionsArray.map((section, index) => (
              <tr key={index} onClick={() => handleSectionClick(section)}>
                <td style={thTdStyle}>{index + 1}</td>
                <td style={thTdStyle}>{section.originalContent}</td>
                <td style={thTdStyle}>{section.currentContent}</td>
                <td style={thTdStyle}>
                  {section.sectionDurationSeconds.toFixed(2)}{" "}
                  <Button
                    variant="link"
                    onClick={() => fetchAudio(section.historyItemId)}
                  >
                    <Play color="white" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: "20px", textAlign: "center", color: "white" }}>
          <p>Total Duration: {currentTotalDuration.toFixed(2)} seconds</p>
        </div>
      </div>
      <Button
        variant="success"
        onClick={handleSubmit}
        style={{ marginRight: "20px", width: "200px" }} // Setting a fixed width
        title="Finalize the voiceover"
      >
        Finalize the voiceover
      </Button>
      {/* Audio Player */}
      {audioUrl && (
        <div style={{ position: "relative", marginTop: "400px" }}>
          <SimpleAudioPlayer
            audioSrc={audioUrl}
            audioTitle={`Section ${selectedSection.getIndex() + 1} `}
          />
        </div>
      )}
    </div>
  );
}

export default StitchSections;

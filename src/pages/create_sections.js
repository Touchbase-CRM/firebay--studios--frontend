import React, { useState, useEffect, useRef } from "react";
import {
  Row,
  Col,
  Card,
  Form,
  Navbar,
  Nav,
  Button,
  Spinner,
} from "react-bootstrap";
import { useRouter } from "next/router";

import useUserInputsStore from "../store/userInputs";

import withAuth from "../hocs/withAuth";
import { getAuth } from "firebase/auth";
import app from "../firebase";

import { getPortalUrl } from "../stripe_proxy_sdk";
import { usePostHog } from "posthog-js/react";
import Swal from "sweetalert2";

import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  query,
  collection,
  where,
} from "firebase/firestore";

function CreateSections() {
  const posthog = usePostHog();
  const auth = getAuth();

  const router = useRouter();
  const voiceAudioPlayerRef = useRef(null);

  // Zustand store hooks
  const {
    ogScriptWordsArray, //holds the original script words as an array of strings.
    setOgScriptWordsArray,
    originalScriptString, //holds the original script as a single string enabling user to add or remove new words. This does not contain any transformations.
    setOriginalScriptString,
    transformedWords, //holds transformed words as an object of strings where the keys are the original word indexes and the values are the transformed word..
    setTransformedWords,
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
  } = useUserInputsStore();

  // const [showExamples, setShowExamples] = useState(false);
  const [voiceOptions, setVoiceOptions] = useState([]);
  const [isFormSubmitted, setFormSubmitted] = useState(false);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);

  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedWordIndex, setSelectedWordIndex] = useState(null);

  const CHACRACTEROVERFLOWTHRESHOLD = 15; // This is the threshold we will use to avoid overflow
  const CHARACTERSPERSEC = 15.2; // Experimentally determined characters per second
  const [sections, setSections] = useState([]);

  var charLimit = Math.round(parseInt(adLength) * CHARACTERSPERSEC); // Calculate character limit based on the ad length
  charLimit = charLimit - CHACRACTEROVERFLOWTHRESHOLD; // substracting a threshold to avoid overflow

  useEffect(() => {
    if (isFormSubmitted) {
      router.push("/add_music");
    }
  }, [isFormSubmitted, router]);

  const validateScript = (script, charLimit, onSuccess, onFailure) => {
    if (script.length > charLimit) {
      onFailure("error", "Oops...", "You have too many characters!");
      return false; // Indicate failure
    }
    if (script.length < 1) {
      onFailure("error", "Oops...", "You cannot have an empty script!");
      return false; // Indicate failure
    }
    onSuccess();
    return true; // Indicate success
  };

  const showAlert = (icon, title, text) => {
    Swal.fire({
      icon: icon,
      title: title,
      text: text,
    });
  };

  const handleScriptChange = (e) => {
    const updatedScript = e.target.value;
    setOriginalScriptString(updatedScript);
    const extractedSections = updatedScript
      .split(/(?<!\.{2})\.(?!\.)\s+/)
      .filter(Boolean);
    setSections(extractedSections);
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

    const isValid = validateScript(
      originalScriptString,
      charLimit,
      () => setFormSubmitted(true),
      showAlert
    );

    if (!isValid) return;
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

  const getFinalScript = () => {
    return ogScriptWordsArray
      .map((word, index) => transformedWords[index] || word)
      .join(" ");
  };

  const wordCountStyle = {
    position: "absolute",
    bottom: "10px",
    right: "10px",
    background: "rgba(0, 0, 0, 0.7)",
    color: "white",
    padding: "0 5px",
    borderRadius: "5px",
  };

  return (
    <div
      style={{
        backgroundColor: "#343a40",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Navbar
        bg="dark"
        variant="dark"
        expand="lg"
        style={{ marginBottom: "20px" }}
      >
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
        <Navbar.Collapse
          id="basic-navbar-nav"
          className="justify-content-between"
        >
          <Nav className="mr-auto">
            {/* Other nav links or content can go here */}
          </Nav>
          {/* This will ensure the CustomDropdown is aligned to the right */}
        </Navbar.Collapse>
      </Navbar>

      <Row>
        <Col md={10} className="mx-auto"></Col>
      </Row>
      <Row>
        <Col md={10} className="mx-auto">
          <Card
            className="p-4 bg-dark text-white"
            style={{
              backgroundColor: "black",
              color: "white",
              marginTop: "10px",
              height: "800px",
              marginBottom: "10px",
            }}
          >
            <Card.Body>
              <Card.Title>Script Editor</Card.Title>
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
              {/* Message to display when script is empty */}
              {originalScriptString === "" && (
                <div className="alert alert-info" role="alert">
                  <strong>Quick guide to Pyro Sections</strong>
                  <br />
                  In Pyro Advanced Ad Generation mode, we split your script into
                  "sections". A section is the smallest unit of voice over that
                  has the same voice properties such as voice actor, intonation,
                  emotions, etc. Note that a section can be either a sentence or
                  a fragment in Pyro, so anywhere you have included period
                  symbol with one or more proceeding white spaces, we will treat
                  it as a new section. Moreover, if you don't have trailing
                  spaces after a period symbol, we will not treat it as a new
                  section.
                </div>
              )}

              <Form.Group controlId="script" style={{ position: "relative" }}>
                <Form.Label>Script</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder={`Enter your script here (up to ${charLimit} characters)`}
                  value={originalScriptString}
                  onChange={handleScriptChange}
                  style={{
                    color: "black",
                    height: "140px",
                    marginBottom: "20px",
                  }}
                />
                <div style={wordCountStyle}>
                  {originalScriptString.length}/{charLimit}
                </div>
              </Form.Group>

              <div
                style={{
                  backgroundColor: "#282c34",
                  padding: "10px",
                  borderRadius: "5px",
                  marginTop: "10px",
                }}
              >
                <div>
                  <Form.Label>Sections from your script</Form.Label>
                  {sections.length > 0 ? (
                    <ol>
                      {sections.map((sentence, index) => (
                        <li key={index} style={{ color: "orange" }}>
                          {sentence}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p style={{ color: "lightblue", fontStyle: "italic" }}>
                      No sections found
                    </p>
                  )}
                </div>
              </div>

              <br></br>
              {/* Display the number of sections found */}
              {sections.length > 0 && (
                <div className="alert alert-success" role="alert">
                  We have found {sections.length} section
                  {sections.length !== 1 ? "s" : ""} in your script. You will be
                  prompted to produce the voice for these one by one in the next
                  few steps.
                </div>
              )}
            </Card.Body>
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
          >
            <Button
              className="mt-3"
              style={{ marginRight: "10px", marginTop: "20px" }}
              onClick={handleSubmit}
            >
              Next
            </Button>
          </div>
          {/* By adding a massive margin top I was able to add the scrollability to mac OS */}
        </Col>
      </Row>
    </div>
  );
}
export default withAuth(CreateSections);

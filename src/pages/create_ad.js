import React, { useState, useEffect, useRef } from "react";
import { Row, Col, Card, Form, Navbar, Nav, Button } from "react-bootstrap";
import { useRouter } from "next/router";

import SimpleAudioPlayer from "../components/SimpleAudioPlayer";
import CustomDropdown from "../components/CustomDropdown";
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

function CreateAd() {
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
    transformedWords, //holds transformed words as an object of strings where the keys are the original word indexes and the values are the transformed word.
    setTransformedWords,
    voiceId,
    setVoiceId,
    voiceName,
    setVoiceName,
    voicePreviewFilename,
    setVoicePreviewFilename,
    adLength,
    setAdLength,
  } = useUserInputsStore();

  // const [showExamples, setShowExamples] = useState(false);
  const [voiceOptions, setVoiceOptions] = useState([]);
  const [isFormSubmitted, setFormSubmitted] = useState(false);
  const [shouldPlayAudio, setShouldPlayAudio] = useState(false);
  const [generatedVoiceUrl, setGeneratedVoiceUrl] = useState("");

  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedWordIndex, setSelectedWordIndex] = useState(null);

  const CHACRACTEROVERFLOWTHRESHOLD = 15; // This is the threshold we will use to avoid overflow
  const CHARACTERSPERSEC = 15.2; // Experimentally determined characters per second

  var charLimit = Math.round(parseInt(adLength) * CHARACTERSPERSEC); // Calculate character limit based on the ad length
  charLimit = charLimit - CHACRACTEROVERFLOWTHRESHOLD; // substracting a threshold to avoid overflow

  useEffect(() => {
    if (isFormSubmitted) {
      router.push("/add_music");
    }
  }, [isFormSubmitted, router]);

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

  useEffect(() => {
    // This will be called when generatedVoiceUrl changes, performing cleanup of the old URL
    return () => {
      if (generatedVoiceUrl) {
        URL.revokeObjectURL(generatedVoiceUrl);
      }
    };
  }, [generatedVoiceUrl]);

  const baseVoicePreviewsUrl =
    "https://static--files--storage.s3.us-east-2.amazonaws.com/voice--previews/";

  const handleLeftClick = (event, index) => {
    event.preventDefault();
    setShowMenu(!showMenu);
    setMenuPosition({ x: event.clientX, y: event.clientY });
    setSelectedWordIndex(index);
  };

  const transformWord = (action) => {
    let currentWord =
      transformedWords[selectedWordIndex] ||
      ogScriptWordsArray[selectedWordIndex];

    switch (action) {
      case "upper":
        transformedWords[selectedWordIndex] = currentWord.toUpperCase();
        break;
      case "lower":
        transformedWords[selectedWordIndex] = currentWord.toLowerCase();
        break;
      case "emphasize":
        if (currentWord.startsWith("'") && currentWord.endsWith("'")) {
          transformedWords[selectedWordIndex] = currentWord.slice(1, -1);
        } else {
          transformedWords[selectedWordIndex] = `'${currentWord}'`;
        }
        break;
      case "reset":
        delete transformedWords[selectedWordIndex];
        break;
      default:
        break;
    }

    setTransformedWords({ ...transformedWords });
    setShowMenu(false);
  };

  const handleScriptChange = (e) => {
    const updatedScript = e.target.value;
    setOriginalScriptString(updatedScript);
    const newWords = updatedScript.split(" ");
    const newTransformedWords = {};

    newWords.forEach((word, index) => {
      if (ogScriptWordsArray[index] === word && transformedWords[index]) {
        newTransformedWords[index] = transformedWords[index];
      }
    });

    setOgScriptWordsArray(newWords);
    setTransformedWords(newTransformedWords);
  };

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

    if (metadata && metadata.newVoiceId && metadata.newVoicePreviewFilename) {
      setVoiceId(metadata.newVoiceId);
      setVoicePreviewFilename(metadata.newVoicePreviewFilename);
      setVoiceName(selectedVoiceName);
      setShouldPlayAudio(true);
    } else {
      // Handle the case when no metadata is found
      console.log(
        "No metadata found for the selected voice:",
        selectedVoiceName
      );
    }

    const userId = auth.currentUser ? auth.currentUser.uid : "anonymous";
    posthog.capture("create-ad-voice-change-drop-down-expanded", {
      date: new Date().toISOString(),
      userId: userId,
      voiceId: voiceId,
      voiceName: voiceName,
    });

    if (voiceAudioPlayerRef.current) {
      voiceAudioPlayerRef.current.src = voiceId;
      voiceAudioPlayerRef.current.load();
      voiceAudioPlayerRef.current.play();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (originalScriptString.length > charLimit) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "You have too many characters!",
      });
      return;
    }
    if (originalScriptString.length < 1) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "You cannot have an empty script!",
      });
      return;
    }

    setFormSubmitted(true);
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
  const handleManageSubscription = async () => {
    const userId = auth.currentUser ? auth.currentUser.uid : "anonymous";

    if (userId === process.env.NEXT_PUBLIC_PYRO_GUEST_FIREBASE_UID) {
      Swal.fire({
        icon: "info",
        title: "Oops...",
        text: "Trial users are not authorized to manage subscriptions.",
      });
      return;
    }
    try {
      // SweetAlert2 confirmation dialog
      const result = Swal.fire({
        title: "Redirecting to Subscription Management",
        text: "You will be redirected to the subscription management page in a new tab.",
        icon: "info",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "Got it!",
      });

      const portalUrl = await getPortalUrl(app);
      window.open(portalUrl, "_blank");
    } catch (error) {
      console.error("Error opening portal: ", error);
    }
  };
  const handleGenerateVoice = async () => {
    const options = {
      method: "POST",
      headers: {
        "xi-api-key": process.env.NEXT_PUBLIC_ELEVEN_LABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: '{"text":"hello Kaveen 2"}',
    };

    fetch(
      "https://api.elevenlabs.io/v1/text-to-speech/6wLJ4Wm2OxvAvetEUBCS",
      options
    )
      .then((response) => {
        if (response.ok) {
          return response.blob(); // Get a blob when the content is audio/mp3
        }
        throw new Error("Network response was not ok.");
      })
      .then((blob) => {
        // Create a URL from the blob
        const audioUrl = URL.createObjectURL(blob);
        setGeneratedVoiceUrl(audioUrl); // Update state with the URL for the audio player
      })
      .catch((err) => console.error(err));
  };

  const dropdownItems = [
    {
      text: "Manage Subscription",
      handler: handleManageSubscription,
    },
    {
      text: "Logout",
      handler: handleLogout,
    },
  ];

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
          <div style={{ paddingRight: "25px" }}>
            <CustomDropdown items={dropdownItems} />
          </div>
        </Navbar.Collapse>
      </Navbar>

      <Row>
        <Col md={10} className="mx-auto">
          <Card
            className="p-4 bg-dark text-white"
            style={{
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
                <Form.Select
                  aria-label="Voice select"
                  value={voiceName} // This should be the voice name, not the ID
                  onChange={handleVoiceChange}
                  style={{ color: "black" }}
                >
                  {voiceOptions.map((voice, index) => (
                    <option key={index} value={voice}>
                      {" "}
                      {/* Use unique index or better yet, a unique ID */}
                      {voice}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Form>
          </Card>
        </Col>
      </Row>
      <Row>
        <Col md={10} className="mx-auto">
          <Card
            className="p-4 bg-dark text-white"
            style={{
              backgroundColor: "black",
              color: "white",
              marginTop: "10px",
              height: "600px",
              marginBottom: "10px",
            }}
          >
            <Card.Body>
              <Card.Title>Script Editor</Card.Title>

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

              <div>
                {" "}
                <Form.Label>Click on a word to change its emphasis</Form.Label>
              </div>
              <div
                style={{
                  backgroundColor: "#282c34",
                  padding: "10px",
                  borderRadius: "5px",
                  marginTop: "10px",
                }}
              >
                {ogScriptWordsArray.map((word, index) => (
                  <span
                    key={index}
                    onClick={(e) => handleLeftClick(e, index)}
                    style={{
                      marginRight: "5px",
                      cursor: "pointer",
                      textDecoration: "underline",
                      textDecorationColor: "transparent",
                      color: "orange",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.textDecorationColor = "orange")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.textDecorationColor = "transparent")
                    }
                  >
                    {transformedWords[index] || word}
                  </span>
                ))}
              </div>

              <div
                style={{
                  position: "absolute",
                  bottom: "10px",
                  left: "10px",
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
            </Card.Body>
            {/* Position the Generate Voice button at the bottom right of the card */}
            <Button
              onClick={handleGenerateVoice}
              style={{
                position: "absolute", // Position the button absolutely
                bottom: "10px", // 10px from the bottom
                right: "10px", // 10px from the right
              }}
            >
              Generate Voice
            </Button>
          </Card>
          {/* By adding a massive margin top I was able to add the scrollability to mac OS */}
          <div style={{ position: "relative", marginTop: "400px" }}>
            <SimpleAudioPlayer
              audioSrc={
                generatedVoiceUrl || baseVoicePreviewsUrl + voicePreviewFilename
              }
              audioTitle={voiceName}
            />
          </div>

          {showMenu && (
            <div
              style={{
                position: "absolute",
                top: menuPosition.y,
                left: menuPosition.x,
                zIndex: 1000,
                backgroundColor: "#f8f9fa",
                boxShadow: "0px 8px 16px 0px rgba(0,0,0,0.2)",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                padding: "8px 12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              <h6
                style={{
                  marginBottom: "10px",
                  color: "#333",
                  fontWeight: "500",
                  fontSize: "13px",
                }}
              >
                Word Smith
              </h6>
              <button
                className="btn btn-light"
                onClick={() => transformWord("upper")}
                style={{ marginBottom: "8px", fontSize: "12px" }}
              >
                Upper Case
              </button>
              <button
                className="btn btn-light"
                onClick={() => transformWord("lower")}
                style={{ marginBottom: "8px", fontSize: "12px" }}
              >
                Lower Case
              </button>
              <button
                className="btn btn-light"
                onClick={() => transformWord("emphasize")}
                style={{ marginBottom: "8px", fontSize: "12px" }}
              >
                Emphasize
              </button>

              <button
                className="btn btn-light"
                style={{ marginBottom: "8px", fontSize: "12px" }}
                onClick={() => transformWord("reset")}
              >
                Reset Word
              </button>

              <button
                className="btn btn-light"
                onClick={() => setShowMenu(false)}
                style={{ fontSize: "12px" }}
              >
                Close
              </button>
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
}
export default withAuth(CreateAd);

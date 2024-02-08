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

import "bootstrap-icons/font/bootstrap-icons.css";
import SimpleAudioPlayer from "../components/SimpleAudioPlayer";
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

  var charLimit = Math.round(parseInt(adLength) * CHARACTERSPERSEC); // Calculate character limit based on the ad length
  charLimit = charLimit - CHACRACTEROVERFLOWTHRESHOLD; // substracting a threshold to avoid overflow

  useEffect(() => {
    if (isFormSubmitted) {
      router.push("/add_music");
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

    // Function to remove all existing emphasis (quotes and uppercase)
    const removeExistingEmphasis = (word) => {
      if (word.startsWith("'") && word.endsWith("'")) {
        // Remove only the outer quotes
        return word.slice(1, -1);
      }
      return word; // Return the word as is if it doesn't have outer quotes
    };

    switch (action) {
      case "emphasizeLevel1":
        transformedWords[selectedWordIndex] =
          removeExistingEmphasis(currentWord).toUpperCase();
        break;
      case "emphasizeLevel2":
        // Use the original form of the word for Level 2
        transformedWords[
          selectedWordIndex
        ] = `'${ogScriptWordsArray[selectedWordIndex]}'`;
        break;
      case "emphasizeLevel3":
        // Uppercase the original form and add quotes
        transformedWords[selectedWordIndex] = `'${ogScriptWordsArray[
          selectedWordIndex
        ].toUpperCase()}'`;
        break;
      case "removeEmphasis":
        transformedWords[selectedWordIndex] =
          ogScriptWordsArray[selectedWordIndex]; // Reset to original word
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

    const userId = auth.currentUser ? auth.currentUser.uid : "anonymous";
    // posthog.capture("create-ad-voice-change-drop-down-expanded", {
    //   date: new Date().toISOString(),
    //   userId: userId,
    //   voiceId: voiceId,
    //   voiceName: voiceName,
    // });

    // Assuming you want to play the new voice preview immediately
    if (metadata.newVoicePreviewFilename) {
      const previewUrl =
        baseVoicePreviewsUrl + metadata.newVoicePreviewFilename;
      if (voiceAudioPlayerRef.current) {
        voiceAudioPlayerRef.current.src = previewUrl;
        voiceAudioPlayerRef.current.load();
        voiceAudioPlayerRef.current.play();
      }
    }
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

    // if (!historyItemId) {
    //   handleGenerateVoice();
    // }
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

  const getFinalScript = () => {
    return ogScriptWordsArray
      .map((word, index) => transformedWords[index] || word)
      .join(" ");
  };

  const handleGenerateVoice = async () => {
    const isValid = validateScript(
      originalScriptString,
      charLimit,
      () => {},
      showAlert
    );

    if (!isValid) return;
    setIsGeneratingVoice(true);

    if (generatedVoiceUrl) {
      URL.revokeObjectURL(generatedVoiceUrl);
    }
    let finalScript = getFinalScript();

    const options = {
      method: "POST",
      headers: {
        "xi-api-key": process.env.NEXT_PUBLIC_ELEVEN_LABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: finalScript, model_id: modelId }),
    };

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        options
      );
      if (!response.ok) {
        throw new Error("Network response was not ok.");
      }

      // Extract history_item_id from headers
      const historyItemId = response.headers.get("history-item-id");
      if (historyItemId) {
        setHistoryItemId(historyItemId); // Update state with history_item_id
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("audio/")) {
        // Handle audio response
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        setGeneratedVoiceUrl(audioUrl); // Update state with the URL for the audio player
        posthog.capture("create-ad-voice-generated", {
          userId: auth.currentUser ? auth.currentUser.uid : "anonymous",
          voiceId: voiceId,
          finalScript: finalScript,
        });
      } else {
        throw new Error("Unexpected content type received.");
      }
    } catch (err) {
      console.error(err);
    }
    setIsGeneratingVoice(false);
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
              height: "800px",
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
                  backgroundColor: "#e4e4e4",
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
                      color: "#eb631c",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.textDecorationColor = "#eb631c")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.textDecorationColor = "transparent")
                    }
                  >
                    {transformedWords[index] || word}
                  </span>
                ))}
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
          >
            <Button
              className="mt-3"
              style={{
                marginRight: "10px",
                marginTop: "20px",
                backgroundColor: "#EB631C",
                borderColor: "#EB631C",
              }}
              onClick={handleSubmit}
            >
              Next
            </Button>
          </div>
          {/* By adding a massive margin top I was able to add the scrollability to mac OS */}
          <div style={{ position: "relative", marginTop: "400px" }}>
            <SimpleAudioPlayer
              audioSrc={
                generatedVoiceUrl || baseVoicePreviewsUrl + voicePreviewFilename
              }
              audioTitle={voiceName}
              allowDownload={generatedVoiceUrl !== ""}
            />
          </div>

          {showMenu && (
            <div
              style={{
                position: "absolute",
                top: menuPosition.y,
                left: menuPosition.x,
                zIndex: 1000,
                backgroundColor: "#eb631c",
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
                onClick={() => transformWord("emphasizeLevel3")}
                style={{ marginBottom: "8px", fontSize: "12px" }}
              >
                High Emphasis
              </button>
              <button
                className="btn btn-light"
                onClick={() => transformWord("emphasizeLevel2")}
                style={{ marginBottom: "8px", fontSize: "12px" }}
              >
                Medium Emphasis
              </button>
              <button
                className="btn btn-light"
                onClick={() => transformWord("emphasizeLevel1")}
                style={{ marginBottom: "8px", fontSize: "12px" }}
              >
                Low Emphasis
              </button>

              <button
                className="btn btn-light"
                style={{ marginBottom: "8px", fontSize: "12px" }}
                onClick={() => transformWord("removeEmphasis")}
              >
                Remove Emphasis
              </button>

              <button
                className="btn btn-light"
                onClick={() => setShowMenu(false)}
                style={{ fontSize: "12px" }}
              >
                Close Menu
              </button>
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
}
export default withAuth(CreateAd);

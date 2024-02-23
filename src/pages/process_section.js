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
  ProgressBar,
  Alert,
} from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useRouter } from "next/router";
import { generateVoiceWithElevenLabsAPI } from "../services/elevenLabsService";

import SimpleAudioPlayer from "../components/SimpleAudioPlayer";
import BackButton from "@/components/BackButton";
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
import _ from "lodash";
import { Stack } from "../dataStructures/stack";

function ProcessSection() {
  const posthog = usePostHog();
  const auth = getAuth();

  const router = useRouter();
  const voiceAudioPlayerRef = useRef(null);
  // prettier-ignore
  const audioProcessingWebServiceUrl = process.env.NODE_ENV === "development"
  ? "http://localhost:8000"
  : "https://vgz580uujk.execute-api.us-east-2.amazonaws.com";

  // Zustand store hooks
  const {
    sectionsQueue,
    setSectionsQueue,
    sectionsStack,
    setSectionsStack,
    sectionsArray,
    setSectionsArray,
    dequeueSectionZustand,
    adLength,
    currentSectionObj,
    addToSectionArrayZustand,
    setCurrentSectionObjZustand,
    setTempSectionObjHolder,
    numSectionsIdentified,
    reset: resetUserInputsStore,
    generatedVoiceUrl,
    setGeneratedVoiceUrl,
    lastEditedSectionIdx,
  } = useUserInputsStore();

  const [voiceOptions, setVoiceOptions] = useState([]);
  const [isFormSubmitted, setFormSubmitted] = useState(false);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [localCurrentSectionObj, setLocalCurrentSectionObj] =
    useState(currentSectionObj);
  const [localSectionsQueue, setLocalSectionsQueue] = useState(sectionsQueue);
  const [localSectionsArray, setLocalSectionsArray] = useState(sectionsArray);
  const [localStack, setLocalStack] = useState(() => new Stack());
  const syncStackWithGlobal = useUserInputsStore((state) => state.setStack);
  const speechRateOptions = [
    { label: "Normal", value: "Normal" },
    { label: "1.25x", value: "1.25X" },
    { label: "1.5x", value: "1.5X" },
    { label: "1.75x", value: "1.75X" },
    { label: "2x", value: "2X" },
  ];

  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedWordIndex, setSelectedWordIndex] = useState(null);
  const [speechRate, setSpeechRate] = useState(
    localCurrentSectionObj.getSpeechRate()
  );

  const [ogScriptWordsArray, setOgScriptWordsArray] = useState(
    localCurrentSectionObj.getOriginalContent()
      ? localCurrentSectionObj.getCurrentWords()
      : []
  );
  const [typedText, setTypedText] = useState(ogScriptWordsArray.join(" "));
  const [transformedWords, setTransformedWords] = useState(
    localCurrentSectionObj.getCurrentTransformations()
  );

  const previousSectionsTotalDuration = localSectionsArray
    .slice(0, localCurrentSectionObj.getIndex())
    .reduce((sum, section) => sum + section.getSectionDurationSeconds(), 0);

  const [progressBarPercentage, setProgressBarPercentage] = useState(
    Math.round(
      ((previousSectionsTotalDuration +
        localCurrentSectionObj.getSectionDurationSeconds()) /
        adLength) *
        100
    )
  );
  const [secondsYouhaveLeft, setSecondsYouHaveLeft] = useState(
    adLength -
      (previousSectionsTotalDuration +
        localCurrentSectionObj.getSectionDurationSeconds())
  );

  var charLimit = localCurrentSectionObj.getOriginalCharCount(); // Calculate character limit based on the ad length
  // charLimit = charLimit - CHACRACTEROVERFLOWTHRESHOLD; // substracting a threshold to avoid overflow

  // On component mount, initialize the local stack with the global stack's items
  useEffect(() => {
    const globalStack = useUserInputsStore.getState().sectionsStack;
    const newStack = new Stack();
    newStack.items = [...globalStack.items];
    setLocalStack(newStack);
  }, []);

  useEffect(() => {
    if (localStack.isEmpty()) return;
    const lastIdx = localStack.pop();
    const newCurrentSectionObj = sectionsArray[lastIdx];

    // Call the utility function with the new section object
    updateSectionDetails(newCurrentSectionObj);

    // Calculate and set progress bar percentage and seconds left
    const progressBarPercentage = Math.round(
      ((previousSectionsTotalDuration +
        newCurrentSectionObj.getSectionDurationSeconds()) /
        adLength) *
        100
    );
    setProgressBarPercentage(progressBarPercentage);
    const secondsLeft =
      adLength -
      (previousSectionsTotalDuration +
        newCurrentSectionObj.getSectionDurationSeconds());
    setSecondsYouHaveLeft(secondsLeft);
    setCurrentSectionObjZustand(newCurrentSectionObj.clone());
  }, [localStack]);

  // Utility function to set all section details
  function updateSectionDetails(sectionObj) {
    setSpeechRate(sectionObj.getSpeechRate());
    setTypedText(sectionObj.getOriginalContent());
    setTransformedWords(sectionObj.getCurrentTransformations());
    setOgScriptWordsArray(sectionObj.getCurrentWords());
  }

  const localPushData = (newData) => {
    localStack.push(newData);
    // Trigger state update with a new reference to ensure re-render
    setLocalStack(localStack.clone());
  };

  const localPopData = () => {
    let removedData = localStack.pop();
    // Trigger state update with a new reference to ensure re-render
    setLocalStack(localStack.clone());
    return removedData;
  };

  useEffect(() => {
    // prevent back button
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = ""; // Chrome requires returnValue to be set
    };

    const handleBackButton = async () => {
      handleLogout();
    };
    localCurrentSectionObj;

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.onpopstate = handleBackButton;

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.onpopstate = null;
    };
  }, [router]);

  useEffect(() => {
    // Update local state when currentSectionObj changes
    setLocalCurrentSectionObj(currentSectionObj.clone());
    // setSpeechRate(currentSectionObj.getSpeechRate());
    // setVoiceId(currentSectionObj.getVoiceId());
  }, [currentSectionObj.getIndex()]);

  useEffect(() => {
    if (isFormSubmitted && localSectionsQueue.size() === 0) {
      // Check if the queue is empty

      router.push("/stitch_sections");
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

  const baseVoicePreviewsUrl =
    "https://static--files--storage.s3.us-east-2.amazonaws.com/voice--previews/";

  const validateScript = (script, charLimit, onSuccess, onFailure) => {
    const scriptWOApostrophe = script.replace(/'/g, "");
    if (scriptWOApostrophe.replace(/'/g, "").length > charLimit) {
      onFailure("error", "Oops...", "You have too many characters!");
      return false; // Indicate failure
    }
    if (scriptWOApostrophe.length < 1) {
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

  async function fetchAudioFromPyroBackendDistribution(pyroHistoryItemId) {
    const bucketName = "workingdir--storage";
    const objectName = `primary--distribution/${pyroHistoryItemId}`;

    try {
      // Make a POST request to your API route, sending the object name to get the signed URL
      const response = await fetch("/api/S3/fetchAudioFromS3", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bucketName, objectName }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Use the signed URL directly for audio playback or download
      // Here, return the URL for further use, such as setting it as the src for an audio element
      return data.url;
    } catch (error) {
      console.error("Error fetching audio URL from API:", error);
      throw new Error("Failed to fetch audio URL from API");
    }
  }

  async function preprocessVoiceover({
    script,
    voice,
    modelId,
    userId,
    dragonsBreathMode = false,
    talkSpeed = "Normal",
    legalDisclaimer = false,
  }) {
    //Define a variable called voiceGender where the value is determined by delimiting voicePreviewFilename string with / and picking the first segment
    const voiceGender = localCurrentSectionObj
      .getVoicePreviewFilename()
      .split("/")[0];
    try {
      const response = await fetch(
        audioProcessingWebServiceUrl + "/preprocess-voiceover",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            script,
            voice,
            model_id: modelId,
            voice_gender: voiceGender,
            user_id: userId,
            dragons_breath_mode: dragonsBreathMode,
            speech_rate: talkSpeed,
            legal_disclaimer: legalDisclaimer,
          }),
        }
      );

      if (!response.ok) {
        // Handle HTTP errors
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data["pyro_history_item_id"]) {
        return data["pyro_history_item_id"];
      } else {
        throw new Error("pyro_history_item_id not found in response");
      }
    } catch (error) {
      console.error("Fetching error:", error);
      // Return or throw a specific error object based on your error handling strategy
      return { error: error.message };
    }
  }

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

    const removeExistingEmphasis = (word) => {
      if (word.startsWith("'") && word.endsWith("'")) {
        return word.slice(1, -1);
      }
      return word;
    };

    let newTransformedWords = { ...transformedWords }; // Create a new copy of the transformedWords object

    switch (action) {
      case "emphasizeLevel1":
        newTransformedWords[selectedWordIndex] =
          removeExistingEmphasis(currentWord).toUpperCase();
        break;
      case "emphasizeLevel2":
        newTransformedWords[
          selectedWordIndex
        ] = `'${ogScriptWordsArray[selectedWordIndex]}'`;
        break;
      case "emphasizeLevel3":
        newTransformedWords[selectedWordIndex] = `'${ogScriptWordsArray[
          selectedWordIndex
        ].toUpperCase()}'`;
        break;
      case "removeEmphasis":
        newTransformedWords[selectedWordIndex] =
          ogScriptWordsArray[selectedWordIndex];
        break;
      default:
        break;
    }

    setTransformedWords(newTransformedWords); // Update the state with the new object
    setShowMenu(false);
  };
  const handleSpeechRate = (event) => {
    const newSpeechRate = event.target.value;
    setSpeechRate(newSpeechRate); // This will now trigger a re-render
    localCurrentSectionObj.setSpeechRate(newSpeechRate); // Assuming you still need to keep this updated
  };

  const handleScriptChange = (e) => {
    const updatedScript = e.target.value;
    setTypedText(updatedScript);
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
      localCurrentSectionObj.setModelId(metadata.newVoiceModelId);
      localCurrentSectionObj.setVoiceId(metadata.newVoiceId);
      localCurrentSectionObj.setVoiceName(selectedVoiceName);
      localCurrentSectionObj.setVoicePreviewFilename(
        metadata.newVoicePreviewFilename
      );
      setLocalCurrentSectionObj(localCurrentSectionObj.clone());

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
      if (voiceAudioPlayerRef.current) {
        voiceAudioPlayerRef.current.src = previewUrl;
        voiceAudioPlayerRef.current.load();
        voiceAudioPlayerRef.current.play();
      }
    }
  };

  const syncLocalStackWithGlobal = () => {
    syncStackWithGlobal(localStack);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!localCurrentSectionObj.getHistoryItemId()) {
      showAlert(
        "info",
        "Action Required",
        "Please generate the voice audio before proceeding further."
      );
      return;
    }
    posthog.capture("process-section-next-button-clicked", {
      dragonsBreathMode: localCurrentSectionObj.getDragonBreathEnhancement(),
      voiceId: localCurrentSectionObj.getVoiceId(),
    });
    localCurrentSectionObj.setCurrentTransformations(transformedWords);
    localCurrentSectionObj.setCurrentWords(ogScriptWordsArray);
    const index = localCurrentSectionObj.getIndex();

    if (localStack.size() > 0) {
      console.log("Stack not empty, continue processing");
      // save the section we are working on
      localSectionsArray[index] = localCurrentSectionObj;
      setLocalSectionsArray(localSectionsArray);

      // load the next section
      let topIdxOnStack = localPopData();
      setCurrentSectionObjZustand(localSectionsArray[topIdxOnStack]);
      syncLocalStackWithGlobal;
    } else {
      console.log(index, localCurrentSectionObj);
      // if (index >= 0 && index < localSectionsArray.length) {
      if (false) {
        // @TODO: disabled edit stitch section for now
        console.log("Turns out to be a temp object");
        setTempSectionObjHolder(localCurrentSectionObj);
      } else {
        // addToSectionArrayZustand(localCurrentSectionObj);
        console.log("Yo I am at regular section submit");
        localSectionsArray[index] = localCurrentSectionObj;
        setSectionsArray(localSectionsArray);
      }

      if (localSectionsQueue.size() === 0) {
        setSectionsQueue(localSectionsQueue);
        router.push("/stitch_sections");
      } else {
        console.log("Queue not empty, continue processing");
        const dequeuedSectionIdx = localSectionsQueue.dequeue();
        const dequeuedSection = localSectionsArray[dequeuedSectionIdx];
        setCurrentSectionObjZustand(dequeuedSection);
        setSectionsQueue(localSectionsQueue);

        const currentSectionContent = dequeuedSection.getCurrentContent();

        // Update the original script string to the last dequeued item
        setTypedText(currentSectionContent || "");

        // Split the dequeued item into words and update transformed words
        const newWords = currentSectionContent
          ? currentSectionContent.split(" ")
          : [];

        // Update the original script words array and transformed words
        setOgScriptWordsArray(newWords);
        setTransformedWords({}); // Reset the transformed words
      }
    }
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

  const getFinalScript = () => {
    return ogScriptWordsArray
      .map((word, index) => transformedWords[index] || word)
      .join(" ");
  };
  const getFinalScriptWOTransformations = () => {
    return ogScriptWordsArray.join(" ");
  };

  async function generateVoiceWithCustomPreprocess(
    script,
    voiceId,
    modelId,
    userId,
    dragonsBreathMode,
    talkSpeed,
    legalDisclaimer
  ) {
    try {
      const pyroHistoryItemId = await preprocessVoiceover({
        script,
        voice: voiceId,
        modelId: modelId,
        userId,
        dragonsBreathMode: dragonsBreathMode,
        talkSpeed: talkSpeed,
        legalDisclaimer: legalDisclaimer,
      });

      if (!pyroHistoryItemId) {
        throw new Error("Failed to preprocess voiceover");
      }

      const audioUrl = await fetchAudioFromPyroBackendDistribution(
        pyroHistoryItemId
      );
      return { audioUrl, localHistoryItemId: pyroHistoryItemId };
    } catch (error) {
      console.error("Error in generating voice with custom preprocess:", error);
      throw error; // Propagate error to be handled in the calling function
    }
  }

  async function handleGenerateVoice() {
    const isValid = validateScript(typedText, charLimit, () => {}, showAlert);

    if (!isValid) return;
    setIsGeneratingVoice(true);

    let audioUrl = "";
    let localHistoryItemId;

    if (generatedVoiceUrl) {
      URL.revokeObjectURL(generatedVoiceUrl);
    }

    const mostUptodateSection = getFinalScript();

    try {
      const preprocessRequired =
        localCurrentSectionObj.getDragonBreathEnhancement() ||
        localCurrentSectionObj.getSpeechRate() !== "Normal";

      if (!preprocessRequired) {
        const result = await generateVoiceWithElevenLabsAPI(
          mostUptodateSection,
          localCurrentSectionObj.getModelId(),
          localCurrentSectionObj.getVoiceId()
        );
        audioUrl = result.audioUrl;
        localHistoryItemId = result.localHistoryItemId;
      } else {
        const result = await generateVoiceWithCustomPreprocess(
          mostUptodateSection,
          localCurrentSectionObj.getVoiceId(),
          localCurrentSectionObj.getModelId(),
          auth.currentUser.uid,
          localCurrentSectionObj.getDragonBreathEnhancement(),
          localCurrentSectionObj.getSpeechRate(),
          true
        );
        audioUrl = result.audioUrl;
        localHistoryItemId = result.localHistoryItemId;
      }

      setGeneratedVoiceUrl(audioUrl);

      const audio = new Audio(audioUrl);
      audio.addEventListener("loadedmetadata", () => {
        const newDuration = audio.duration;
        localCurrentSectionObj.setSectionDurationSeconds(newDuration);
        setProgressBarPercentage(
          Math.round(
            ((previousSectionsTotalDuration + newDuration) / adLength) * 100
          )
        );
        setSecondsYouHaveLeft(
          adLength - previousSectionsTotalDuration - newDuration
        );
      });

      localCurrentSectionObj.setHistoryItemId(localHistoryItemId);
      localCurrentSectionObj.setCurrentContent(mostUptodateSection);
      setLocalCurrentSectionObj(localCurrentSectionObj.clone());
    } catch (error) {
      console.error("Error generating voice:", error);
    } finally {
      setIsGeneratingVoice(false);
    }
  }

  const handleDragonBreathEnhancementChange = (e) => {
    const newValue = e.target.checked;
    localCurrentSectionObj.setDragonBreathEnhancement(newValue);
    setLocalCurrentSectionObj(localCurrentSectionObj.clone());
  };

  const handleGoBack = () => {
    console.log("going back");
    const currentSectionIdx = localCurrentSectionObj.getIndex();
    localPushData(currentSectionIdx);
    localPushData(currentSectionIdx - 1);
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
            className="p-4"
            style={{
              borderRadius: "1rem",
              borderColor: "#eb631c",
              color: "black",
              marginTop: "10px",
              marginBottom: "10px",
              height: "180px",
            }}
          >
            <div
              style={{
                position: "absolute", // Absolutely position the BackButton
                top: "10px", // Adjust as needed
                left: "10px", // Adjust as needed
                marginBottom: "20px",
              }}
            >
              {
                <BackButton
                  width="30px"
                  height="30px"
                  backgroundColor="#eb631c"
                  onClick={handleGoBack} // Pass the onClick method directly
                />
              }
            </div>
            <Card.Title style={{ marginTop: "20px" }}>
              Section {localCurrentSectionObj.getIndex() + 1} of{" "}
              {numSectionsIdentified}
            </Card.Title>
            <Form key={localCurrentSectionObj.getHistoryItemId()}>
              <Form.Group controlId="voice">
                <Form.Label>Voiceover Progress</Form.Label>
                <ProgressBar
                  now={progressBarPercentage}
                  label={`${progressBarPercentage}%`}
                />
              </Form.Group>
              {""}
              <>
                You have roughly {Math.round(secondsYouhaveLeft)} seconds left
                out of {adLength} seconds.
              </>
            </Form>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={10} className="mx-auto">
          <Card
            className="p-4"
            style={{
              borderRadius: "1rem",
              borderColor: "#eb631c",
              color: "black",
              marginTop: "10px",
              height: "310px",
              marginBottom: "10px",
            }}
          >
            <Card.Title>Voice Editor</Card.Title>
            <Form>
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
                    value={localCurrentSectionObj.getVoiceName()} // This should be the voice name, not the ID
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
              <Form.Group
                controlId="dragonBreathToggle"
                className="d-flex align-items-center"
                style={{ marginTop: "10px" }}
              >
                <Form.Label className="mb-0" style={{ marginRight: "10px" }}>
                  Dragon's Breath Enhancement
                </Form.Label>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="dragonBreathEnhancementSwitch"
                    checked={localCurrentSectionObj.getDragonBreathEnhancement()}
                    onChange={handleDragonBreathEnhancementChange}
                    style={{
                      backgroundColor:
                        localCurrentSectionObj.getDragonBreathEnhancement()
                          ? "#eb631c"
                          : "white",
                      borderColor:
                        localCurrentSectionObj.getDragonBreathEnhancement()
                          ? "#eb631c"
                          : "#adb5bd",
                    }}
                  />
                </div>
              </Form.Group>
              <Form.Group
                controlId="dragonBreathToggle"
                className="d-flex align-items-center"
                style={{ marginTop: "5px" }}
              >
                {!localCurrentSectionObj.getDragonBreathEnhancement() && (
                  <Alert
                    style={{
                      variant: "info",
                      fontSize: "10px",
                      padding: "5px 10px",
                    }}
                  >
                    Pyro Tip: 10X the energy of the selected voice as if a sword
                    forged by dragon's breath
                  </Alert>
                )}
              </Form.Group>
              {/* Speech Rate Dropdown Menu */}
              <Form.Group controlId="speechRate" style={{ marginTop: "10px" }}>
                <Form.Label>Speech Rate</Form.Label>
                <Form.Select
                  aria-label="Speech rate select"
                  value={speechRate}
                  onChange={handleSpeechRate}
                >
                  {speechRateOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
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
            className="p-4"
            style={{
              borderRadius: "1rem",
              borderColor: "#eb631c",
              color: "black",
              marginTop: "10px",
              height: "500px",
              marginBottom: "10px",
            }}
          >
            <Card.Body>
              <Card.Title>Section Editor</Card.Title>

              <Form.Group controlId="script" style={{ position: "relative" }}>
                <Form.Label>Edit section</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder={`Enter your script here (up to ${charLimit} characters)`}
                  value={typedText}
                  onChange={handleScriptChange}
                  style={{
                    color: "black",
                    height: "70px",
                    marginBottom: "20px",
                  }}
                />
                <div style={wordCountStyle}>
                  {typedText.replace(/'/g, "").length}/{charLimit}
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
                {typedText.split(" ").map((word, index) => (
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
              {lastEditedSectionIdx !== localCurrentSectionObj.getIndex()
                ? "Next"
                : "Done"}
            </Button>
          </div>
          {/* By adding a massive margin top I was able to add the scrollability to mac OS */}
          <div style={{ position: "relative", marginTop: "400px" }}>
            <SimpleAudioPlayer
              audioSrc={
                generatedVoiceUrl ||
                baseVoicePreviewsUrl +
                  localCurrentSectionObj.getVoicePreviewFilename()
              }
              audioTitle={localCurrentSectionObj.getVoiceName()}
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
export default withAuth(ProcessSection);

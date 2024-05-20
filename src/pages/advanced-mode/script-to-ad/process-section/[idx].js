// Relative path: src/pages/advanced-mode/script-to-ad/process-section/[idx].js
import React, { useState, useEffect, useRef } from "react";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Spinner,
  ProgressBar,
  Alert,
} from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useRouter } from "next/router";
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
import { getAuth } from "firebase/auth";
import app from "@/firebase";
import { usePostHog } from "posthog-js/react";
import Swal from "sweetalert2";

import { generateVoiceWithElevenLabsAPI } from "@/middleware/tts";
import { NavBar } from "@/components/foundation-components/nav-bar";
import SimpleAudioPlayer from "@/components/simple-audio-player";
import BackButton from "@/components/buttons/back-button";
import { PlayButton } from "@/components/buttons/play-button/play";

import useUserInputsStore from "@/store/user-inputs";
import withAuth from "@/hocs/with-auth";
import { Stack } from "@/data-structures/stack";
import { fetchAudioFromPyroBackendDistribution } from "@/utils/fetch-audio/fetch-from-distribution";
import { updateExistingSpotInDb } from "@/utils/db-read-write-ops/serialization-utils";
import { HistoryCanvas } from "@/_pages/advanced-mode/script-to-ad/process-section/components/history-canvas";
import { SecondaryActionButton } from "@/components/buttons/secondary-action-button";

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
    spotId,
    spotName,
    sectionsArray,
    setSectionsArray,
    sectionHistoryArray,
    setSectionHistoryArray,
    adLength,
    numSectionsIdentified,
    s2aAdvancedFreeStyleStatus,
    reset: resetUserInputsStore,
  } = useUserInputsStore();

  const saveFeatureSpecificStates = {
    sectionsArray,
    sectionHistoryArray,
    numSectionsIdentified,
    s2aAdvancedFreeStyleStatus,
  };

  const saveSharedStates = {
    spotId,
    adLength,
  };

  const { idx } = router.query;
  const [currentSectionIndex, setCurrentSectionIndex] = useState(
    parseInt(idx, 10)
  );

  const [voiceOptions, setVoiceOptions] = useState([]);
  const [isFormSubmitted, setFormSubmitted] = useState(false);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [localCurrentSectionObj, setLocalCurrentSectionObj] = useState(() => {
    return sectionsArray?.[currentSectionIndex].clone() || null;
  });

  const [localSectionsArray, setLocalSectionsArray] = useState(sectionsArray);

  const [localSectionHistoryObj, setLocalSectionHistoryObj] = useState(
    sectionHistoryArray[currentSectionIndex] || null
  );
  const [localStack, setLocalStack] = useState(() => new Stack());
  const syncStackWithGlobal = useUserInputsStore(
    (state) => state.setNavigationStack
  );
  const speechRateOptions = [
    { label: "Normal", value: "Normal" },
    { label: "1.25x", value: "1.25X" },
    { label: "1.5x", value: "1.5X" },
    { label: "1.75x", value: "1.75X" },
    { label: "2x", value: "2X" },
  ];
  const [offcanvasVisible, setOffcanvasVisibility] = useState(false);

  const hideOffcanvas = () => setOffcanvasVisibility(false);
  const showOffcanvas = () => setOffcanvasVisibility(true);

  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedWordIndex, setSelectedWordIndex] = useState(null);

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

  const [generatedVoiceUrl, setGeneratedVoiceUrl] = useState("");
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [allowDownload, setAllowDownload] = useState(false);
  var charLimit = localCurrentSectionObj.getOriginalCharCount(); // Calculate character limit based on the ad length
  const [forceRenderKey, setForceRenderKey] = useState(0);
  const restrictedVoices = ["Evan (Cloned)"];
  const CHARACTERSPERSEC = 15.2; // Experimentally determined characters per second
  const ADDITIONALWAITTIME = 6000; // 5 seconds; Experimentally determined.
  const SECTOMILLISEC = 1000;

  const syncStackAfterNavigation = () => {
    const globalStack = useUserInputsStore.getState().navigationStack;
    const newStack = new Stack();
    newStack.items = [...globalStack.items];
    setLocalStack(newStack);
  };

  const updateSectionDetails = (sectionToUpdate) => {
    const currentIdx = sectionToUpdate.getIndex();

    // Update dependent states based on the new current section
    setOgScriptWordsArray(
      sectionToUpdate.getOriginalContent()
        ? sectionToUpdate.getCurrentWords()
        : []
    );
    setTypedText(
      sectionToUpdate.getOriginalContent()
        ? sectionToUpdate.getCurrentWords().join(" ")
        : ""
    );
    setTransformedWords(sectionToUpdate.getCurrentTransformations());

    // Calculate progress and time left
    const previousSectionsTotalDuration = sectionsArray
      .slice(0, currentIdx)
      .reduce((sum, section) => sum + section.getSectionDurationSeconds(), 0);
    const newProgressBarPercentage = Math.round(
      ((previousSectionsTotalDuration +
        sectionToUpdate.getSectionDurationSeconds()) /
        adLength) *
        100
    );
    const newSecondsLeft =
      adLength -
      (previousSectionsTotalDuration +
        sectionToUpdate.getSectionDurationSeconds());

    setProgressBarPercentage(newProgressBarPercentage);
    setSecondsYouHaveLeft(newSecondsLeft);
    setGeneratedVoiceUrl(sectionToUpdate.getGeneratedVoiceUrl());
  };

  useEffect(() => {
    const currentIdx = parseInt(idx, 10);
    syncStackAfterNavigation();

    // no need to update if the current section is the same
    if (currentIdx === localCurrentSectionObj.getIndex()) {
      return;
    }

    setCurrentSectionIndex(currentIdx);
    setLocalSectionHistoryObj(sectionHistoryArray[currentIdx] || null);

    if (!isNaN(currentIdx) && sectionsArray?.length > currentIdx) {
      const sectionToUpdate = sectionsArray[currentIdx];

      setLocalCurrentSectionObj(sectionToUpdate);
      updateSectionDetails(sectionToUpdate);
      setShowAudioPlayer(false);
    }
  }, [idx]);

  useEffect(() => {
    updateSectionDetails(localCurrentSectionObj);
  }, [localCurrentSectionObj.getGeneratedVoiceUrl()]);

  const localPushData = (newData, clone = false) => {
    localStack.push(newData);
    if (clone) {
      setLocalStack(localStack.clone());
    } else {
      setLocalStack(localStack);
    }
  };

  const localPopData = (newData, clone = false) => {
    let removedData = localStack.pop();
    if (clone) {
      setLocalStack(localStack.clone());
    } else {
      setLocalStack(localStack);
    }
    return removedData;
  };

  useEffect(() => {
    if (isFormSubmitted) {
      router.push("/advanced-mode/script-to-ad/stitch-sections");
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

    if (
      !s2aAdvancedFreeStyleStatus &&
      scriptWOApostrophe.replace(/'/g, "").length > charLimit
    ) {
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
  const handleVoicePreviewPlayButton = () => {
    setAllowDownload(false);
    setShowAudioPlayer(true);
    setForceRenderKey(Math.random());
    setGeneratedVoiceUrl(
      baseVoicePreviewsUrl + localCurrentSectionObj.getVoicePreviewFilename()
    );
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
    localCurrentSectionObj.setSpeechRate(newSpeechRate);
    setLocalCurrentSectionObj(localCurrentSectionObj.clone());
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

      // // Reset the generatedVoiceUrl to force the audio player to use the new voice preview
      setGeneratedVoiceUrl(
        baseVoicePreviewsUrl + localCurrentSectionObj.getVoicePreviewFilename()
      );
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

  const addCurrentSectionHistoryToArray = (index, newSectionHistoryObj) => {
    const currentArray = useUserInputsStore.getState().sectionHistoryArray;
    const updatedArray = [
      ...currentArray.slice(0, index),
      newSectionHistoryObj,
      ...currentArray.slice(index + 1),
    ];
    return updatedArray;
  };

  const syncSectionHistoryArrayWithZustand = (index, newSectionHistoryObj) => {
    const updatedArray = addCurrentSectionHistoryToArray(
      index,
      newSectionHistoryObj
    );
    setSectionHistoryArray(updatedArray);
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
    if (process.env.NODE_ENV !== "development") {
      posthog.capture("process-section-next-button-clicked", {
        dragonsBreathMode: localCurrentSectionObj.getDragonBreathEnhancement(),
        voiceId: localCurrentSectionObj.getVoiceId(),
      });
    }
    // sync the local history with global.
    syncSectionHistoryArrayWithZustand(
      currentSectionIndex,
      localSectionHistoryObj
    );
    localCurrentSectionObj.setCurrentTransformations(transformedWords);
    localCurrentSectionObj.setCurrentWords(ogScriptWordsArray);
    const index = localCurrentSectionObj.getIndex();

    if (localStack.size() > 0) {
      console.log("Stack not empty, continue processing");
      // save the section we are working on
      localSectionsArray[index] = localCurrentSectionObj;
      setLocalSectionsArray(localSectionsArray);

      // load the next section
      let lastInUrl = localPopData();
      syncLocalStackWithGlobal();
      handleSaveState();

      router.push(lastInUrl);
    } else {
      localSectionsArray[index] = localCurrentSectionObj;
      setSectionsArray(localSectionsArray);
      handleSaveState();

      if (currentSectionIndex >= sectionsArray.length - 1) {
        router.push("/advanced-mode/script-to-ad/stitch-sections");
      } else {
        router.push(
          "/advanced-mode/script-to-ad/process-section/[idx]",
          `/advanced-mode/script-to-ad/process-section/${
            currentSectionIndex + 1
          }`
        );
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

      // @TODO: Replace estimatedProcessingTime with a pub/sub.
      const estimatedProcessingTime =
        (1 / CHARACTERSPERSEC) *
          localCurrentSectionObj.getCurrentCharCount() *
          SECTOMILLISEC +
        ADDITIONALWAITTIME;

      const audioUrl = await fetchAudioFromPyroBackendDistribution(
        pyroHistoryItemId,
        estimatedProcessingTime
      );

      return { audioUrl, localHistoryItemId: pyroHistoryItemId };
    } catch (error) {
      console.error("Error in generating voice with custom preprocess:", error);
      throw error; // Propagate error to be handled in the calling function
    }
  }

  const updateLocalSectionHistoryObj = (newKeyValuePair) => {
    setLocalSectionHistoryObj((prevMap) => {
      const updatedMap = new Map(prevMap);
      for (const [key, value] of Object.entries(newKeyValuePair)) {
        updatedMap.set(key, value);
      }
      return updatedMap;
    });
  };

  async function handleGenerateVoice() {
    const isValid = validateScript(typedText, charLimit, () => {}, showAlert);

    if (!isValid) return;
    setIsGeneratingVoice(true);

    let audioUrl = "";
    let localHistoryItemId;

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
        // Repeated code
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

        // Repeated code
        audioUrl = result.audioUrl;
        localHistoryItemId = result.localHistoryItemId;
      }

      setAllowDownload(true);
      setShowAudioPlayer(true);
      setGeneratedVoiceUrl(audioUrl);

      const newDuration = await getAudioDuration(audioUrl);

      setProgressBarPercentage(
        Math.round(
          ((previousSectionsTotalDuration + newDuration) / adLength) * 100
        )
      );
      setSecondsYouHaveLeft(
        adLength - previousSectionsTotalDuration - newDuration
      );
      localCurrentSectionObj.setCurrentTransformations(transformedWords);
      localCurrentSectionObj.setCurrentWords(ogScriptWordsArray);
      localCurrentSectionObj.setSectionDurationSeconds(newDuration);
      localCurrentSectionObj.setHistoryItemId(localHistoryItemId);
      localCurrentSectionObj.setCurrentContent(mostUptodateSection);
      localCurrentSectionObj.setGeneratedVoiceUrl(audioUrl);
      setLocalCurrentSectionObj(localCurrentSectionObj.clone()); // can we get rid of the clone here?
      updateLocalSectionHistoryObj({
        [localCurrentSectionObj.getHistoryItemId()]: localCurrentSectionObj,
      });
    } catch (error) {
      console.error("Error generating voice:", error);
      if (error.name === "NetworkError") {
        // Handle network errors specifically
        console.error("Check your network or API endpoint:", error);
      } else if (error.message.includes("pyro_history_item_id")) {
        // Handle missing ID errors specifically
        console.error(
          "API response missing required 'pyro_history_item_id':",
          error
        );
      } else {
        // Handle all other errors
        console.error("Processing error:", error);
      }
    } finally {
      setIsGeneratingVoice(false);
    }
  }

  function getAudioDuration(url) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      audio.addEventListener("loadedmetadata", () => {
        resolve(audio.duration);
      });
      audio.addEventListener("error", reject);
    });
  }

  const handleDragonBreathEnhancementChange = (e) => {
    const newValue = e.target.checked;
    localCurrentSectionObj.setDragonBreathEnhancement(newValue);
    setLocalCurrentSectionObj(localCurrentSectionObj.clone());
  };

  const handleGoBack = () => {
    // save the current work
    const currentSectionIdx = localCurrentSectionObj.getIndex();
    updateLocalSectionHistoryObj({
      [localCurrentSectionObj.getHistoryItemId()]: localCurrentSectionObj,
    });
    syncSectionHistoryArrayWithZustand(
      currentSectionIndex,
      localSectionHistoryObj
    );
    localSectionsArray[currentSectionIdx] = localCurrentSectionObj;
    setSectionsArray(localSectionsArray);

    // save the current url in the stack
    localPushData(
      `/advanced-mode/script-to-ad/process-section/${currentSectionIdx}`
    );
    syncLocalStackWithGlobal();
    handleSaveState();
    // move to the new url
    if (currentSectionIdx > 0) {
      router.push(
        "/advanced-mode/script-to-ad/process-section/[idx]",
        `/advanced-mode/script-to-ad/process-section/${currentSectionIdx - 1}`
      );
    } else {
      router.push("/advanced-mode/script-to-ad/create-sections");
    }
  };

  const handleReadReplayButton = () => {
    setForceRenderKey(Math.random());
    setAllowDownload(true);
    setShowAudioPlayer(true);
    setGeneratedVoiceUrl(localCurrentSectionObj.getGeneratedVoiceUrl());
  };

  const playAudioUrl = (audioUrl) => {
    setForceRenderKey(Math.random());
    setAllowDownload(true);
    setShowAudioPlayer(true);
    setGeneratedVoiceUrl(audioUrl);
  };

  const changeCurrentSectionObj = (newSectionObj) => {
    setLocalCurrentSectionObj(newSectionObj.clone());
  };

  const handleSaveState = () => {
    localSectionsArray[currentSectionIndex] = localCurrentSectionObj;
    setSectionsArray(localSectionsArray);
    // can't wait for above function to finish so repeat it without saving to zustand.
    saveFeatureSpecificStates.sectionsArray = localSectionsArray;
    syncSectionHistoryArrayWithZustand(
      currentSectionIndex,
      localSectionHistoryObj
    );
    // can't wait for above function to finish so repeat it without saving to zustand.
    const tmpHistoryArray = addCurrentSectionHistoryToArray(
      currentSectionIndex,
      localSectionHistoryObj
    );
    saveFeatureSpecificStates.sectionHistoryArray = tmpHistoryArray;

    updateExistingSpotInDb({
      spotId: spotId,
      mode: "advanced-script-to-ad",
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
    // {
    //   label: "About",
    //   url: "/about",
    //   // Optionally, some links might not have an icon
    //   style: { marginRight: "10px" },
    // },
    // Add more links as needed
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
              {localCurrentSectionObj.getIndex() !== 0 && (
                <BackButton
                  width="30px"
                  height="30px"
                  backgroundColor="#eb631c"
                  onClick={handleGoBack} // Pass the onClick method directly
                />
              )}
            </div>
            <Card.Title style={{ marginTop: "20px" }}>
              Section {localCurrentSectionObj.getIndex() + 1} of{" "}
              {numSectionsIdentified}
            </Card.Title>
            <Form key={localCurrentSectionObj.getHistoryItemId()}>
              <Form.Group controlId="voice" style={{ marginBottom: "10px" }}>
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
              height: "320px",
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
                  <div style={{ display: "flex", alignItems: "center" }}>
                    {" "}
                    <Form.Select
                      aria-label="Voice select"
                      value={localCurrentSectionObj.getVoiceName()} // This should be the voice name, not the ID
                      onChange={handleVoiceChange}
                      style={{ color: "black", marginRight: "10px" }}
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
                    <PlayButton
                      onClickHandler={handleVoicePreviewPlayButton}
                      handlerArgs={[]}
                      size="32px"
                      preventDefault={true}
                    />{" "}
                  </div>
                )}
              </Form.Group>
              <div>
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
                  {!localCurrentSectionObj.getDragonBreathEnhancement() ? (
                    <Alert
                      style={{
                        variant: "info",
                        fontSize: "10px",
                        padding: "5px 10px",
                      }}
                    >
                      Pyro Tip: 10X the energy of the selected voice as if a
                      sword forged by dragon's breath
                    </Alert>
                  ) : null}
                </Form.Group>
                {/* Speech Rate Dropdown Menu */}
                <Form.Group
                  controlId="speechRate"
                  style={{ marginTop: "10px" }}
                >
                  <Form.Label>Speech Rate</Form.Label>
                  <Form.Select
                    aria-label="Speech rate select"
                    value={localCurrentSectionObj.getSpeechRate()}
                    onChange={handleSpeechRate}
                  >
                    {speechRateOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
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
                <div style={{ display: "flex", alignItems: "center" }}>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder={`Enter your script here (up to ${charLimit} characters)`}
                    value={typedText}
                    onChange={handleScriptChange}
                    style={{
                      color: "black",
                      height: "70px",
                      marginRight: "10px", // Add a right margin to separate the textarea and the button
                      marginBottom: "10px",
                    }}
                  />

                  <PlayButton
                    onClickHandler={handleReadReplayButton} // You might need to modify the handler for this button's specific action
                    handlerArgs={[]}
                    size="32px" // Ensure this matches the size of the other play button for consistency
                    preventDefault={true}
                    isDisabled={
                      localCurrentSectionObj.getGeneratedVoiceUrl() === ""
                    }
                  />
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: "15px",
                    right: "50px", // Adjust as necessary if the play button affects the positioning
                    background: "rgba(0, 0, 0, 0.7)",
                    color: "white",
                    padding: "0 5px",
                    borderRadius: "5px",
                  }}
                >
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
              display: "flex", // Enable flexbox
              justifyContent: "flex-start", // Align items to the start of the container
              alignItems: "center", // Align items vertically
              bottom: "10px",
              left: "10px",
              fontSize: "small",
              fontWeight: "bold",
              fontStyle: "italic",
            }}
          >
            {/* Next Button */}
            <Button
              className="mt-3"
              style={{
                marginRight: "auto", // Push all subsequent items to the right
                marginTop: "20px",
                backgroundColor: "#EB631C",
                borderColor: "#EB631C",
              }}
              onClick={handleSubmit}
            >
              {"Next"}
            </Button>
            {/* Save Button */}
            <SecondaryActionButton
              onClick={handleSaveState}
              initialText="Save"
              clickedText="Saved!"
              duration={1000}
              marginRight="10px"
              marginTop="20px"
            />

            {/* History Button */}
            <SecondaryActionButton
              onClick={showOffcanvas}
              initialText="History"
              clickedText="History!"
              duration={1000}
              disabled={
                !(
                  localCurrentSectionObj.getGeneratedVoiceUrl() !== "" &&
                  localSectionHistoryObj &&
                  localSectionHistoryObj[currentSectionIndex] !== null
                )
              }
              opacity={
                localCurrentSectionObj.getGeneratedVoiceUrl() !== "" &&
                localSectionHistoryObj &&
                localSectionHistoryObj[currentSectionIndex] !== null
                  ? "1"
                  : "0.5"
              }
              marginRight="0px"
              marginTop="20px"
            />
            <HistoryCanvas
              show={offcanvasVisible}
              handleClose={hideOffcanvas}
              localSectionHistoryObj={localSectionHistoryObj}
              playAudioUrl={playAudioUrl}
              changeCurrentSectionObj={changeCurrentSectionObj}
            />
          </div>

          {/* By adding a massive margin top I was able to add the scrollability to mac OS */}
          <div style={{ position: "relative", marginTop: "400px" }}>
            {showAudioPlayer && (
              <SimpleAudioPlayer
                audioSrc={generatedVoiceUrl}
                audioTitle={localCurrentSectionObj.getVoiceName()}
                allowDownload={allowDownload}
                autoplay={true}
                forceRender={forceRenderKey}
              />
            )}
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

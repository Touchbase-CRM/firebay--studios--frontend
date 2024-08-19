import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Form,
  Button,
  Spinner,
  ProgressBar,
  Alert,
  OverlayTrigger,
  Tooltip,
  Dropdown,
  DropdownButton,
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
import FireSlider from "@/components/foundation-components/slider";
import SimpleAudioPlayer from "@/components/simple-audio-player";
import BackButton from "@/components/buttons/back-button";
import { PlayButton } from "@/components/buttons/play-button/play";
import RenameModal from "@/components/rename-modal";
import { SecondaryActionButton } from "@/components/buttons/secondary-action-button";

import useUserInputsStore from "@/store/user-inputs";
import withAuth from "@/hocs/with-auth";
import { Stack } from "@/data-structures/stack";
import { Section } from "@/data-structures/section";

import { fetchAudioFromPyroBackendDistribution } from "@/utils/fetch-audio/fetch-from-distribution";
import { updateExistingSpotInDb } from "@/utils/db-read-write-ops/serialization-utils";
import { calculateCharCount } from "@/utils/string-ops/string-properties";

import { HistoryCanvas } from "@/_pages/advanced-mode/script-to-ad/process-section/components/history-canvas";
import WordSmithOffcanvas from "@/_pages/advanced-mode/script-to-ad/process-section/components/word-smith";
import NotePad from "@/_pages/advanced-mode/script-to-ad/process-section/components/note-pad";
import SplitSection from "@/_pages/advanced-mode/script-to-ad/process-section/components/split-section";

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
    setSpotName,
    sectionsArray,
    setSectionsArray,
    sectionHistoryArray,
    setSectionHistoryArray,
    adLength,
    numSectionsIdentified,
    setNumSectionsIdentified,
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
    spotName,
    spotId,
    adLength,
  };

  const { idx } = router.query;
  const [currentSectionIndex, setCurrentSectionIndex] = useState(
    parseInt(idx, 10)
  );

  const [voiceOptions, setVoiceOptions] = useState([]);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [localCurrentSectionObj, setLocalCurrentSectionObj] = useState(() => {
    return sectionsArray?.[currentSectionIndex].clone() || null;
  });

  const [localSectionsArray, setLocalSectionsArray] = useState(sectionsArray);
  const [localSectionHistoryObj, setLocalSectionHistoryObj] = useState(
    sectionHistoryArray[currentSectionIndex] || null
  );
  const [localStack, setLocalStack] = useState(() => new Stack()); //@TODO: Rename this variable to localNavigationStack
  const syncStackWithGlobal = useUserInputsStore(
    (state) => state.setNavigationStack
  );

  const [offcanvasVisible, setOffcanvasVisibility] = useState(false);
  const [historyOffcanvasVisible, setHistoryOffcanvasVisibility] = useState(false);

  const hideOffcanvas = () => setOffcanvasVisibility(false);
  const showOffcanvas = () => {
    setOffcanvasVisibility(true);
  };

  const hideHistoryOffcanvas = () => setHistoryOffcanvasVisibility(false);
  const showHistoryOffcanvas = () => setHistoryOffcanvasVisibility(true);

  const [showNotePad, setShowNotePad] = useState(false);

  const handleShowNotePad = () => setShowNotePad(true);
  const handleCloseNotePad = () => setShowNotePad(false);

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

  // State for managing modal visibility and spot name editing
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newSpotName, setNewSpotName] = useState(spotName);
  const [forceRenderKey, setForceRenderKey] = useState(0);
  const [showOptions, setShowOptions] = useState(false); // State to control options visibility
  const [showSplitSectionModal, setShowSplitSectionModal] = useState(false);

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

  const manageLegacySpeechRate = (legacyValue) => {
    const legacyMapping = {
      Normal: 0,
      "1.25x": 25,
      "1.5x": 50,
      "1.75x": 75,
      "2x": 100,
    };

    if (legacyMapping.hasOwnProperty(legacyValue)) {
      return legacyMapping[legacyValue];
    }

    const numericValue = Number(legacyValue);
    if (!isNaN(numericValue) && numericValue >= -50 && numericValue <= 100) {
      return numericValue;
    }

    // If the value is neither a legacy string nor a valid number, return 0 by default
    return 0;
  };

  const handleVoicePreviewPlayButton = () => {
    setAllowDownload(false);
    setShowAudioPlayer(true);
    setForceRenderKey(Math.random());
    setGeneratedVoiceUrl(
      baseVoicePreviewsUrl + localCurrentSectionObj.getVoicePreviewFilename()
    );
  };

  const handleWordClick = (index) => {
    setSelectedWordIndex(index);
  };

  const handleAddNewSection = () => {
    setShowSplitSectionModal(true);
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
    setSelectedWordIndex(null);
    setShowOptions(false); // Hide the options and show the words again
  };

  const handleSpeechRate = (value) => {
    localCurrentSectionObj.setSpeechRate(value);
    setLocalCurrentSectionObj(localCurrentSectionObj.clone());
  };

  const processScriptChange = (newScript) => {
    setTypedText(newScript);
    const newWords = newScript.split(" ");
    const newTransformedWords = {};

    newWords.forEach((word, index) => {
      if (ogScriptWordsArray[index] === word && transformedWords[index]) {
        newTransformedWords[index] = transformedWords[index];
      }
    });

    setOgScriptWordsArray(newWords);
    setTransformedWords(newTransformedWords);
  };

  const handleScriptChange = (e) => {
    const updatedScript = e.target.value;
    processScriptChange(updatedScript);
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
          newVoiceIntonationConsistency: docData.stability * 100,
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
      metadata?.newVoiceId != null &&
      metadata?.newVoicePreviewFilename != null &&
      metadata?.newVoiceModelId != null &&
      metadata?.newVoiceIntonationConsistency != null
    ) {
      localCurrentSectionObj.setModelId(metadata.newVoiceModelId);
      localCurrentSectionObj.setVoiceId(metadata.newVoiceId);
      localCurrentSectionObj.setVoiceName(selectedVoiceName);
      localCurrentSectionObj.setVoicePreviewFilename(
        metadata.newVoicePreviewFilename
      );
      localCurrentSectionObj.setVoiceIntonationConsistency(
        metadata.newVoiceIntonationConsistency
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

  const updateVoiceForAllSections = (currentIndex) => {
    localSectionsArray.forEach((section, index) => {
      if (index > currentIndex && localSectionsArray[currentIndex + 1]?.getHistoryItemId() !== null) {
        return;
      }

      if (index >= currentIndex) {
        section.setVoiceId(localCurrentSectionObj.getVoiceId());
        section.setVoiceName(localCurrentSectionObj.getVoiceName());
        section.setVoicePreviewFilename(localCurrentSectionObj.getVoicePreviewFilename());
        section.setModelId(localCurrentSectionObj.getModelId());
        section.setVoiceIntonationConsistency(localCurrentSectionObj.getVoiceIntonationConsistency());
        section.setDragonBreathEnhancement(localCurrentSectionObj.getDragonBreathEnhancement());
        section.setSpeechRate(localCurrentSectionObj.getSpeechRate());
      }
    });
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
      updateVoiceForAllSections(index);
      setSectionsArray(localSectionsArray);
      handleSaveState();

      if (currentSectionIndex >= localSectionsArray.length - 1) {
        router.push("/advanced-mode/script-to-ad/stitch-sections");
      } else {
        router.push(
          "/advanced-mode/script-to-ad/process-section/[idx]",
          `/advanced-mode/script-to-ad/process-section/${currentSectionIndex + 1
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
    const isValid = validateScript(typedText, charLimit, () => { }, showAlert);

    if (!isValid) return;
    setIsGeneratingVoice(true);

    let audioUrl = "";
    let localHistoryItemId;

    const mostUptodateSection = getFinalScript();

    try {
      const preprocessRequired =
        localCurrentSectionObj.getDragonBreathEnhancement() ||
        manageLegacySpeechRate(localCurrentSectionObj.getSpeechRate()) !== 0;

      const result = preprocessRequired
        ? await generateVoiceWithCustomPreprocess(
          mostUptodateSection,
          localCurrentSectionObj.getVoiceId(),
          localCurrentSectionObj.getVoiceIntonationConsistency(),
          localCurrentSectionObj.getModelId(),
          auth.currentUser.uid,
          localCurrentSectionObj.getDragonBreathEnhancement(),
          manageLegacySpeechRate(localCurrentSectionObj.getSpeechRate()),
          true
        )
        : await generateVoiceWithElevenLabsAPI(
          mostUptodateSection,
          localCurrentSectionObj.getModelId(),
          localCurrentSectionObj.getVoiceId(),
          localCurrentSectionObj.getVoiceIntonationConsistency()
        );

      // Common code
      audioUrl = result.audioUrl;
      localHistoryItemId = result.localHistoryItemId;

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
      setLocalCurrentSectionObj(localCurrentSectionObj.clone());
      updateLocalSectionHistoryObj({
        [localCurrentSectionObj.getHistoryItemId()]: localCurrentSectionObj,
      });
    } catch (error) {
      console.error("Error generating voice:", error);
      if (error.name === "NetworkError") {
        console.error("Check your network or API endpoint:", error);
      } else if (error.message.includes("pyro_history_item_id")) {
        console.error(
          "API response missing required 'pyro_history_item_id':",
          error
        );
      } else if (error.message.includes("Failed to fetch audio URL from API")) {
        console.error("Too much demand:", error);
        Swal.fire({
          icon: "error",
          title: "Too much demand",
          text: "We have too much demand right now, please try again shortly.",
        });
      } else {
        console.error("Processing error:", error);
      }
    } finally {
      setIsGeneratingVoice(false);
    }
  }

  async function generateVoiceWithCustomPreprocess(
    script,
    voiceId,
    voiceIntonationConsistency,
    modelId,
    userId,
    dragonsBreathMode,
    talkSpeed,
    legalDisclaimer
  ) {
    if (process.env.NODE_ENV !== "development") {
      posthog.capture("process-section-custom-preprocess-used", {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        dragonsBreathMode: dragonsBreathMode,
        speechRate: talkSpeed,
        voiceId: localCurrentSectionObj.getVoiceId(),
      });
    }

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
            voice: voiceId,
            voice_intonation_consistency: voiceIntonationConsistency,
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data || !data["pyro_history_item_id"]) {
        throw new Error("pyro_history_item_id not found in response");
      }

      const pyroHistoryItemId = data["pyro_history_item_id"];
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
      throw error;
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
    if (process.env.NODE_ENV !== "development") {
      posthog.capture("process-section-history-read-used", {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        sectionId: idx,
      });
    }
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

  const handleIntonationChange = (value) => {
    localCurrentSectionObj.setVoiceIntonationConsistency(value);
    setLocalCurrentSectionObj(localCurrentSectionObj.clone());
  };

  const resetSpeechRate = () => {
    handleSpeechRate(0); // Or however you want to reset the speech rate
  };

  const handleSaveNotesProp = () => {
    setLocalCurrentSectionObj(localCurrentSectionObj); // Call the Zustand setter or update the state here
  };

  return (
    <div style={{ backgroundColor: "#FFFFFF", minHeight: "100vh", overflow: "hidden" }}>
      <NavBar links={[]} logoutHandler={handleLogout} saveHandler={handleSaveState} />
      <div className="container-fluid">
        <div className="row" style={{ overflow: "hidden" }}>
          {/* Left Card for Section Editor */}
          <div className="col-12 col-lg-8 p-3" style={{ height: "100%", overflow: "hidden" }}>
            <Card className="p-2 h-100" style={{ borderRadius: "1rem", borderColor: "#eb631c", color: "black", height: "calc(100vh - 60px)" }}>
              <Card.Body className="d-flex flex-column">
                <Card.Title style={{ fontSize: "1.25rem" }}>Section Editor</Card.Title>
                <Form.Group controlId="script" className="position-relative">
                  <Form.Label style={{ fontSize: "0.875rem" }}>Edit section</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder={`Enter your script here (up to ${charLimit} characters)`}
                    value={typedText}
                    onChange={handleScriptChange}
                    maxLength={2000}
                    style={{
                      color: "black",
                      width: "100%",
                      fontSize: "0.875rem",
                      height: "366px", // This height can be dynamically adjusted based on your needs
                      marginBottom: "10px",
                      overflow: "hidden",
                      resize: "none",
                    }}
                  />
                  <div className="d-flex justify-content-between mt-2 flex-wrap">
                    <div className="d-flex justify-content-center w-100">
                      <Button
                        onClick={handleGenerateVoice}
                        disabled={isGeneratingVoice}
                        className="mb-2"
                        style={{
                          backgroundColor: "#EB631C",
                          borderColor: "#EB631C",
                          color: "white",
                          minWidth: "150px",
                          maxWidth: "250px", // Setting a max-width
                          flex: "1 1 auto", // Allow flex to grow and shrink
                          textAlign: "center",
                        }}
                      >
                        {isGeneratingVoice ? (
                          <>
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Generating...
                          </>
                        ) : (
                          "Generate Voice"
                        )}
                      </Button>
                    </div>
                  </div>
                  <div
                    className="position-absolute"
                    style={{
                      bottom: "57px", // Adjust this value according to the height of the textarea
                      right: "0px",
                      background: "rgba(0, 0, 0, 0.7)",
                      color: "white",
                      padding: "0 5px",
                      borderRadius: "5px",
                    }}
                  >
                    {typedText.replace(/'/g, "").length}/{charLimit}
                  </div>
                </Form.Group>
              </Card.Body>
              {showAudioPlayer && (
                <SimpleAudioPlayer
                  audioSrc={generatedVoiceUrl}
                  audioTitle={localCurrentSectionObj.getVoiceName()}
                  allowDownload={allowDownload}
                  autoplay={true}
                  forceRender={forceRenderKey}
                  setShowAudioPlayer={setShowAudioPlayer}
                />
              )}
            </Card>
            <div className="d-flex justify-content-start align-items-center mt-3 flex-wrap">
              <Button className="mt-3 me-auto" style={{ backgroundColor: "#EB631C", borderColor: "#EB631C" }} onClick={handleSubmit}>
                Next
              </Button>
              <SecondaryActionButton onClick={handleSaveState} initialText="Save" clickedText="Saved!" duration={1000} className="me-3 mt-3" />
              <DropdownButton
                variant="outline-secondary"
                title="Actions"
                className="mt-3"
                style={{
                  borderColor: "#FDA942",
                  color: "black",
                  backgroundColor: "white",
                }}

                drop="up"
              >
                <Dropdown.Item onClick={showOffcanvas}>
                  Change Emphasis
                </Dropdown.Item>
                {localCurrentSectionObj.getGeneratedVoiceUrl() !== "" && (
                  <>
                    <Dropdown.Item onClick={showHistoryOffcanvas}>
                      History
                    </Dropdown.Item>
                    <Dropdown.Item onClick={handleReadReplayButton}>
                      Play Latest Read
                    </Dropdown.Item>
                  </>
                )}

                <Dropdown.Item onClick={handleShowNotePad}>
                  Script Notes
                </Dropdown.Item>
                <Dropdown.Item onClick={handleAddNewSection}>
                  Split Current Section
                </Dropdown.Item>

              </DropdownButton>

            </div>
          </div>
          {/* Right Card for Progress Bar and Voice Editor */}
          <div className="col-12 col-lg-4 p-3" style={{ height: "100%", overflow: "hidden" }}>
            <Card className="p-4 h-100" style={{ borderRadius: "1rem", borderColor: "#eb631c", color: "black", height: "calc(100vh - 60px)" }}>
              <div className="position-absolute" style={{ top: "10px", left: "10px", marginBottom: "20px" }}>
                {localCurrentSectionObj.getIndex() !== 0 && <BackButton width="30px" height="30px" backgroundColor="#eb631c" onClick={handleGoBack} />}
              </div>
              <Card.Title className="mt-5" style={{ fontSize: "1.25rem" }}>
                <div className="d-flex align-items-center font-weight-bold">
                  <i className="bi bi-pencil-square me-2" style={{ cursor: "pointer", fontSize: "0.8em" }} onClick={() => setShowRenameModal(true)}></i>
                  {spotName}
                </div>
                <br />
                <span className="text-muted" style={{ fontSize: "0.875rem" }}>Section {localCurrentSectionObj.getIndex() + 1} of {numSectionsIdentified}</span>
              </Card.Title>
              <Form key={localCurrentSectionObj.getHistoryItemId()} className="d-flex flex-column flex-grow-1">
                <Form.Group controlId="voice" className="mb-2">
                  <Form.Label style={{ fontSize: "0.875rem" }}>Voiceover Progress</Form.Label>
                  <ProgressBar now={progressBarPercentage} label={`${progressBarPercentage}%`} />
                </Form.Group>
                <div style={{ fontSize: "0.875rem" }}>Roughly {Math.round(secondsYouhaveLeft)} sec left out of {adLength} sec</div>
                <Form.Group controlId="voice" className="mt-2">
                  <Form.Label style={{ fontSize: "0.875rem" }}>Voice</Form.Label>
                  {voiceOptions.length === 0 ? (
                    <div className="d-flex align-items-center">
                      <Form.Select aria-label="Voice select" disabled className="me-2" style={{ color: "black", fontSize: "0.875rem" }}>
                        <option>Loading voice choices...</option>
                      </Form.Select>
                      <Spinner animation="border" />
                    </div>
                  ) : (
                    <div className="d-flex align-items-center">
                      <Form.Select aria-label="Voice select" value={localCurrentSectionObj.getVoiceName()} onChange={handleVoiceChange} className="me-2" style={{ color: "black", fontSize: "0.875rem" }}>
                        {voiceOptions.filter(voice => {
                          const isRestrictedVoice = restrictedVoices.includes(voice);
                          const isFirebayStudiosEmail = auth.currentUser.email.split("@")[1] === "firebaystudios.com";
                          return !isRestrictedVoice || (isRestrictedVoice && isFirebayStudiosEmail);
                        }).map((voice) => (
                          <option key={voice} value={voice}>{voice}</option>
                        ))}
                      </Form.Select>
                      <PlayButton onClickHandler={handleVoicePreviewPlayButton} handlerArgs={[]} size="32px" preventDefault={true} />
                    </div>
                  )}
                </Form.Group>
                <Form.Group controlId="dragonBreathToggle" className="d-flex align-items-center mt-2">
                  <Form.Label className="mb-0 me-3" style={{ fontSize: "0.875rem" }}>Dragon's Breath Enhancement</Form.Label>
                  <OverlayTrigger placement="right" overlay={<Tooltip id="tooltip-info">Pyro Tip: 10X the energy of the selected voice as if a sword forged by dragon's breath</Tooltip>}>
                    <i className="bi bi-info-circle me-3" style={{ cursor: "pointer" }}></i>
                  </OverlayTrigger>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      id="dragonBreathEnhancementSwitch"
                      checked={localCurrentSectionObj.getDragonBreathEnhancement()}
                      onChange={handleDragonBreathEnhancementChange}
                      style={{
                        backgroundColor: localCurrentSectionObj.getDragonBreathEnhancement() ? "#eb631c" : "white",
                        borderColor: localCurrentSectionObj.getDragonBreathEnhancement() ? "#eb631c" : "#adb5bd",
                      }}
                    />
                  </div>
                </Form.Group>
                {!localCurrentSectionObj.getDragonBreathEnhancement() && (
                  <Alert variant="info" className="mt-1 p-1" style={{ fontSize: "10px" }}>
                    Pyro Tip: 10X the energy of the selected voice as if a sword forged by dragon's breath
                  </Alert>
                )}
                <Form.Group controlId="intonationConsistencyLevel" className="mt-2">
                  <Form.Label style={{ fontSize: "0.875rem" }}>Intonation Consistency Level</Form.Label>
                  <FireSlider
                    min={0}
                    max={100}
                    value={localCurrentSectionObj.getVoiceIntonationConsistency()}
                    onValueChange={handleIntonationChange}
                    thumbColor="#eb631c"
                    trackColor="#f0f0f0"
                    fillColor="#eb631c"
                    showPercentage={true}
                    width="70%"
                    height="10px"
                    containerStyle={{ marginTop: "18px" }}
                    leftInfoMessage="Everytime you hit generate, the intonation will be dramatically different"
                    rightInfoMessage="Everytime you hit generate, the intonation will be consistent"
                  />
                </Form.Group>
                <Form.Group controlId="speechRate" className="mt-2">
                  <Form.Label style={{ fontSize: "0.875rem" }}>Speech Rate</Form.Label>
                  <FireSlider
                    min={0}
                    max={100}
                    value={manageLegacySpeechRate(localCurrentSectionObj.getSpeechRate())}
                    onValueChange={handleSpeechRate}
                    thumbColor="#eb631c"
                    trackColor="#f0f0f0"
                    fillColor="#eb631c"
                    showPercentage={true}
                    width="70%"
                    height="10px"
                    containerStyle={{ marginTop: "18px" }}
                    leftInfoMessage="Slower"
                    rightInfoMessage="Faster"
                    reset={resetSpeechRate}
                  />
                </Form.Group>
              </Form>
            </Card>
          </div>
        </div>
        <RenameModal show={showRenameModal} onHide={() => setShowRenameModal(false)} newSpotName={newSpotName} setNewSpotName={setNewSpotName} spotId={spotId} setSpotName={setSpotName} />
        <WordSmithOffcanvas
          offcanvasVisible={offcanvasVisible}
          hideOffcanvas={hideOffcanvas}
          showOptions={showOptions}
          ogScriptWordsArray={ogScriptWordsArray}
          selectedWordIndex={selectedWordIndex}
          handleWordClick={handleWordClick}
          setShowOptions={setShowOptions}
          transformWord={transformWord}
          typedText={typedText}
          transformedWords={transformedWords}
        />
        <HistoryCanvas
          show={historyOffcanvasVisible}
          handleClose={hideHistoryOffcanvas}
          localSectionHistoryObj={localSectionHistoryObj}
          playAudioUrl={playAudioUrl}
          changeCurrentSectionObj={changeCurrentSectionObj}
        />
      </div>
      <NotePad
        show={showNotePad}
        handleClose={handleCloseNotePad}
        localCurrentSectionObj={localCurrentSectionObj}
        onSaveNotes={handleSaveNotesProp} // Pass the function to NotePad
      />
      <SplitSection
        show={showSplitSectionModal}
        onHide={() => setShowSplitSectionModal(false)}
        currentSectionContent={typedText}
        currentSectionCharCount={calculateCharCount(typedText)}
        localCurrentSectionObj={localCurrentSectionObj}
        localSectionsArray={localSectionsArray}
        setLocalSectionsArray={setLocalSectionsArray}
        setNumSectionsIdentified={setNumSectionsIdentified}
        numSectionsIdentified={numSectionsIdentified}
        setTransformedWords={setTransformedWords}
        setLocalSectionHistoryObj={setLocalSectionHistoryObj}
        processScriptChange={processScriptChange}
      />
    </div>
  );


}

// export default withAuth(ProcessSection);
export default ProcessSection;


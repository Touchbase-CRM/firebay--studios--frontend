import React from "react";
import useUserInputsStore from "../store/userInputs";
function StitchSections() {
  // Zustand store hooks
  const {
    sectionsQueue,
    dequeueSectionZustand,
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
    adSecondsConsumed,
    setAdSecondsConsumed,
    generatedVoiceUrl,
    setGeneratedVoiceUrl,
    historyItemId,
    setHistoryItemId,
    modelId,
    setModelId,
    setSectionHistoryItemIdZustand, // for the current section
    setSectionArrayHistoryItemIdZustand, // for the entire section array
    updateSectionArrayContentZustand,
    currentSectionObj,
    sectionsArray,
    addToSectionArrayZustand,
    setSectionObjDurationZustand,
    setCurrentSectionObjZustand,
  } = useUserInputsStore();

  console.log("final array: ", sectionsArray);
  console.log(
    "history item ids: ",
    sectionsArray.map((section) => section.getHistoryItemId())
  );
  // Function to log sectionsArray
  const logSectionsArray = () => {
    console.log("Latest sectionsArray: ", sectionsArray);
    console.log(" currentSectionObj", currentSectionObj);
  };
  return (
    <div>
      <h1>Under Construction</h1>
      <p>This page is currently under construction. Please check back later.</p>
      <button onClick={logSectionsArray}>Log Sections Array</button>
    </div>
  );
}

export default StitchSections;

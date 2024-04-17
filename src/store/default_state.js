// src/store/defaultState.js
import { Stack } from "../dataStructures/stack";

export const defaultState = {
  // create ad page defaults
  ogScriptWordsArray: [], // An empty array for script words
  originalScriptString: "", // Original script as a string
  transformedWords: {}, // Object for transformed words
  sectionsStack: new Stack(), // Stack for sections
  sectionsArray: [], // Array for section objects
  sectionHistoryArray: [], // Array for section history objects
  voiceId: "6wLJ4Wm2OxvAvetEUBCS",
  voiceName: "Charley",
  voicePreviewFilename: "male/charley.mp3",
  adLength: "30",
  adSecondsConsumed: 0,
  // add music page defaults
  chosenMusic: "Rock: Electro Sport",
  previewFileName: "preview_Electro Sport_Rock.mp3",
  backgroundMusicFilename: "Electro Sport_Rock.mp3",
  musicVol: 0.1,
  generatedVoiceUrl: "",
  historyItemId: null,
  stitchedAudioPyroHistoryItemId: "",
  modelId: "eleven_multilingual_v2",
  numSectionsIdentified: 0,
  navigationStack: new Stack(),
  adGenerationMethod: "",
};

export default defaultState;

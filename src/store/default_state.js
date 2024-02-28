// src/store/defaultState.js
import { Section } from "../dataStructures/section";
import { Stack } from "../dataStructures/stack";

export const defaultState = {
  // create ad page defaults
  ogScriptWordsArray: [], // An empty array for script words
  originalScriptString: "", // Original script as a string
  transformedWords: {}, // Object for transformed words
  sectionsStack: new Stack(), // Stack for sections
  sectionsArray: [], // Array for section objects
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
  currentSectionObj: new Section(null, "", "", null, 0),
  currentSectionObjIdx: null,
  tempSectionObjHolder: new Section(null, "", "", null, 0),
  numSectionsIdentified: 0,
  lastEditedSectionIdx: null,
  navigationStack: new Stack(),
};

export default defaultState;

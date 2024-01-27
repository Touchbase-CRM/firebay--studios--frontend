// src/store/defaultState.js
import { Queue } from "../dataStructures/queue";
import { Section } from "../dataStructures/section";

export const defaultState = {
  // create ad page defaults
  ogScriptWordsArray: [], // An empty array for script words
  originalScriptString: "", // Original script as a string
  transformedWords: {}, // Object for transformed words
  sectionsQueue: new Queue(), // Queue for sections
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
  modelId: "eleven_multilingual_v2",
  currentSectionObj: new Section(0, "", "", null, 0),
  numSectionsIdentified: 0,
};

export default defaultState;

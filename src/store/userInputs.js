// store/userInputs.js
import { create } from "zustand";

// Default values
const defaultState = {
  // create ad page defaults
  ogScriptWordsArray: "".split(" "), //holds the original script words as an array of strings.
  originalScriptString: "", //holds the original script as a single string enabling user to add or remove new words. This does not contain any transformations.
  transformedWords: {}, //holds transformed words as an object of strings where the keys are the original word indexes and the values are the transformed word. Words without transforms are not included.
  voiceId: "6wLJ4Wm2OxvAvetEUBCS",
  voiceName: "Charley",
  voicePreviewFilename: "male/charley.mp3",
  adLength: "30",
  // add music page defaults
  noMusic: false,
  chosenMusic: "Rock: Electro Sport",
  previewFileName: "preview_Electro Sport_Rock.mp3",
  backgroundMusicFilename: "Electro Sport_Rock.mp3",
  musicVol: 0.1,
};

const useUserInputsStore = create((set) => ({
  // Initial state
  ...defaultState,

  // Setters
  setOgScriptWordsArray: (ogScriptWordsArray) => set({ ogScriptWordsArray }),
  setOriginalScriptString: (originalScriptString) =>
    set({ originalScriptString }),
  setTransformedWords: (transformedWords) => set({ transformedWords }),
  setVoiceId: (voiceId) => set({ voiceId }),
  setVoiceName: (voiceName) => set({ voiceName }),
  setVoicePreviewFilename: (filename) =>
    set(() => ({ voicePreviewFilename: filename })),
  setAdLength: (adLength) => set({ adLength }),
  setNoMusic: (noMusic) => set({ noMusic }),
  setChosenMusic: (chosenMusic) => set({ chosenMusic }),
  setMusicVol: (musicVol) => set({ musicVol }),
  setPreviewFileName: (previewFileName) => set({ previewFileName }),
  setBackgroundMusicFilename: (backgroundMusicFilename) =>
    set({ backgroundMusicFilename }),

  // Reset function
  reset: () => set({ ...defaultState }),
}));

export default useUserInputsStore;

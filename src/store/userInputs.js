// store/userInputs.js
import { create } from "zustand";

// Default values
const defaultState = {
  // create ad page defaults
  script: "",
  voiceId: "6wLJ4Wm2OxvAvetEUBCS",
  voiceName: "Charley",
  adLength: "30",
  // add music page defaults
  noMusic: false,
  chosenMusic: "Rock: Electro Sport",
  previewFileName: "preview_Electro Sport_Rock.mp3",
  musicVol: 0.1,
};

const useUserInputsStore = create((set) => ({
  // Initial state
  ...defaultState,

  // Setters
  setScript: (script) => set({ script }),
  setVoiceId: (voiceId) => set({ voiceId }),
  setVoiceName: (voiceName) => set({ voiceName }),
  setAdLength: (adLength) => set({ adLength }),
  setNoMusic: (noMusic) => set({ noMusic }),
  setChosenMusic: (chosenMusic) => set({ chosenMusic }),
  setMusicVol: (musicVol) => set({ musicVol }),
  setPreviewFileName: (previewFileName) => set({ previewFileName }),

  // Reset function
  reset: () => set({ ...defaultState }),
}));

export default useUserInputsStore;

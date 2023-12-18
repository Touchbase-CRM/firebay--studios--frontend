// store/userInputs.js
import { create } from "zustand";

const useUserInputsStore = create((set) => ({
  // create ad page
  script: "",
  voiceId: "6wLJ4Wm2OxvAvetEUBCS",
  voiceName: "Charley",
  adLength: "30",
  setScript: (script) => set({ script }),
  setVoiceId: (voiceId) => set({ voiceId }),
  setVoiceName: (voiceName) => set({ voiceName }),
  setAdLength: (adLength) => set({ adLength }),
  // add music page
  noMusic: false,
  genre: "Up Beat",
  musicVol: 0.1,
  setNoMusic: (noMusic) => set({ noMusic }),
  setGenre: (genre) => set({ genre }),
  setMusicVol: (musicVol) => set({ musicVol }),
}));

export default useUserInputsStore;

// store/userInputs.js
import { create } from "zustand";

const useUserInputsStore = create((set) => ({
  script: "",
  voiceId: "6wLJ4Wm2OxvAvetEUBCS",
  voiceName: "Charley",
  adLength: "30",
  setScript: (script) => set({ script }),
  setVoiceId: (voiceId) => set({ voiceId }),
  setVoiceName: (voiceName) => set({ voiceName }),
  setAdLength: (adLength) => set({ adLength }),
}));

export default useUserInputsStore;

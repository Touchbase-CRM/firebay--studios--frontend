// store/userInputs.js
import { create } from "zustand";
import { Queue } from "../dataStructures/queue";

// Default values
const defaultState = {
  // create ad page defaults
  ogScriptWordsArray: "".split(" "), //holds the original script words as an array of strings.
  originalScriptString: "", //holds the original script as a single string enabling user to add or remove new words. This does not contain any transformations.
  transformedWords: {}, //holds transformed words as an object of strings where the keys are the original word indexes and the values are the transformed word. Words without transforms are not included.
  originalScriptForSectionSplit: "",
  sectionsQueue: new Queue(),
  voiceId: "6wLJ4Wm2OxvAvetEUBCS",
  voiceName: "Charley",
  voicePreviewFilename: "male/charley.mp3",
  adLength: "30",
  // add music page defaults
  chosenMusic: "Rock: Electro Sport",
  previewFileName: "preview_Electro Sport_Rock.mp3",
  backgroundMusicFilename: "Electro Sport_Rock.mp3",
  musicVol: 0.1,
  generatedVoiceUrl: "",
  historyItemId: null,
  modelId: "eleven_multilingual_v2",
};

const useUserInputsStore = create((set) => ({
  // Initial state
  ...defaultState,

  // Setters
  setOgScriptWordsArray: (ogScriptWordsArray) => set({ ogScriptWordsArray }),
  setOriginalScriptString: (originalScriptString) =>
    set({ originalScriptString }),
  setTransformedWords: (transformedWords) => set({ transformedWords }),
  setOriginalScriptForSectionSplit: (originalScriptForSectionSplit) =>
    set({ originalScriptForSectionSplit }),
  setVoiceId: (voiceId) => set({ voiceId }),
  setVoiceName: (voiceName) => set({ voiceName }),
  setVoicePreviewFilename: (filename) =>
    set(() => ({ voicePreviewFilename: filename })),
  setAdLength: (adLength) => set({ adLength }),
  setChosenMusic: (chosenMusic) => set({ chosenMusic }),
  setMusicVol: (musicVol) => set({ musicVol }),
  setPreviewFileName: (previewFileName) => set({ previewFileName }),
  setBackgroundMusicFilename: (backgroundMusicFilename) =>
    set({ backgroundMusicFilename }),
  setGeneratedVoiceUrl: (generatedVoiceUrl) => set({ generatedVoiceUrl }),
  setHistoryItemId: (historyItemId) => set({ historyItemId }),
  setModelId: (modelId) => set({ modelId }),

  // Queue manipulation methods
  enqueueSection: (section) =>
    set((state) => {
      const newQueue = new Queue();
      newQueue.items = [...state.sectionsQueue.items, section];
      return { sectionsQueue: newQueue };
    }),

  dequeueSection: () =>
    set((state) => {
      const newQueue = new Queue();
      newQueue.items = [...state.sectionsQueue.items];
      const dequeuedSection = newQueue.dequeue();
      return { sectionsQueue: newQueue, dequeuedSection };
    }),

  resetSectionsQueue: () => set({ sectionsQueue: new Queue() }),

  // Reset function
  reset: () => set({ ...defaultState }),
}));

export default useUserInputsStore;

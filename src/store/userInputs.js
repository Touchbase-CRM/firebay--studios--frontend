// store/userInputs.js
import { create } from "zustand";
import { Queue } from "../dataStructures/queue";
import { Section } from "../dataStructures/section";
import { produce } from "immer";

// Default values
const defaultState = {
  // create ad page defaults
  ogScriptWordsArray: "".split(" "), //holds the original script words as an array of strings.
  originalScriptString: "", //holds the original script as a single string enabling user to add or remove new words. This does not contain any transformations.
  transformedWords: {}, //holds transformed words as an object of strings where the keys are the original word indexes and the values are the transformed word. Words without transforms are not included.
  sectionsQueue: new Queue(),
  sectionsArray: [],
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
  currentSectionObj: new Section(0, ""),
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
  setChosenMusic: (chosenMusic) => set({ chosenMusic }),
  setMusicVol: (musicVol) => set({ musicVol }),
  setPreviewFileName: (previewFileName) => set({ previewFileName }),
  setBackgroundMusicFilename: (backgroundMusicFilename) =>
    set({ backgroundMusicFilename }),
  setGeneratedVoiceUrl: (generatedVoiceUrl) => set({ generatedVoiceUrl }),
  setHistoryItemId: (historyItemId) => set({ historyItemId }),
  setModelId: (modelId) => set({ modelId }),
  setCurrentSectionObj: (index) => set({ currentSectionObj: index }),

  // Queue Data Structure methods
  enqueueSection: (section) =>
    set(
      produce((state) => {
        state.sectionsQueue.items.push(section);
      })
    ),

  dequeueSection: () =>
    set(
      produce((state) => {
        state.lastDequeuedItem = state.sectionsQueue.items.shift();
      })
    ),

  resetSectionsQueue: () => set({ sectionsQueue: new Queue() }),

  // Section Array Methods
  getSectionByIndex: (index) => {
    const state = get();
    return state.sectionsArray[index];
  },
  addSection: (sectionObject) => {
    set((state) => ({
      sectionsArray: [...state.sectionsArray, sectionObject],
    }));
  },

  setSectionHistoryItemId: (index, newHistoryItemId) => {
    set((state) => {
      const sectionIndex = state.sectionsArray.findIndex(
        (section) => section.getIndex() === index
      );
      if (sectionIndex === -1) return;

      const updatedSection = { ...state.sectionsArray[sectionIndex] };
      updatedSection.setHistoryItemId(newHistoryItemId);

      const newSectionsArray = [...state.sectionsArray];
      newSectionsArray[sectionIndex] = updatedSection;

      return { sectionsArray: newSectionsArray };
    });
  },

  // Setter to update content of a specific Section object
  updateSectionContent: (index, newContent) => {
    set((state) => {
      const sectionIndex = state.sectionsArray.findIndex(
        (section) => section.getIndex() === index
      );
      if (sectionIndex === -1) return;

      // Create a new instance of Section with the updated content
      const currentSection = state.sectionsArray[sectionIndex];
      const updatedSection = new Section(
        currentSection.getIndex(),
        newContent,
        currentSection.getHistoryItemId()
      );

      const newSectionsArray = [...state.sectionsArray];
      newSectionsArray[sectionIndex] = updatedSection;

      return { sectionsArray: newSectionsArray };
    });
  },

  // Reset function
  reset: () => set({ ...defaultState }),
}));

export default useUserInputsStore;

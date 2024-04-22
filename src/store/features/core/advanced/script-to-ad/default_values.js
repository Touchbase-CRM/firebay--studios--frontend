// src/store/features/core/advanced/script-to-ad/default_values.js
import { Stack } from "../../../../../dataStructures/stack";

export const advancedScriptToAdDefaultValues = {
  s2aAdvancedFreeStyleStatus: false,
  sectionsStack: new Stack(), // Stack for sections
  navigationStack: new Stack(),

  sectionsArray: [], // Array for section objects
  sectionHistoryArray: [], // Array for section history objects
  stitchedAudioPyroHistoryItemId: "",
  numSectionsIdentified: 0,
  adSecondsConsumed: 0,
};
export default advancedScriptToAdDefaultValues;

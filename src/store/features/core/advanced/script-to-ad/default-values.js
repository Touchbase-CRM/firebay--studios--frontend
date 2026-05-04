// src/store/features/core/advanced/script-to-ad/default-values.js
import { Stack } from "@/data-structures/stack";

export const advancedScriptToAdDefaultValues = {
  s2aAdvancedFreeStyleStatus: true,
  navigationStack: new Stack(),

  sectionsArray: [], // Array for section objects
  sectionHistoryArray: [], // Array for section history objects
  stitchedAudioPyroHistoryItemId: "",
  numSectionsIdentified: 0,
};
export default advancedScriptToAdDefaultValues;

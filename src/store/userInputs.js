// Relative path: src/store/userInputs.js
import { create } from "zustand";
import { defaultState } from "./shared_default_values";
import { UserInputMethods } from "./shared_setters";

import {
  quickVoiceToAdDefaultValues,
  QuickVoiceToAdSetters,
} from "@/store/features/core/quick/voice-to-ad";

import {
  quickScriptToAdDefaultValues,
  QuickScriptToAdSetters,
} from "./features/core/quick/script-to-ad";

import {
  advancedScriptToAdDefaultValues,
  AdvancedScriptToAdSetters,
} from "@/store/features/core/advanced/script-to-ad";

const useUserInputsStore = create((set) => {
  const userInputMethods = new UserInputMethods(set);
  const quickVoiceToAdSetters = new QuickVoiceToAdSetters(set);
  const quickScriptToAdSetters = new QuickScriptToAdSetters(set);
  const advancedScriptToAdSetters = new AdvancedScriptToAdSetters(set);

  return {
    ...defaultState,
    ...quickVoiceToAdDefaultValues,
    ...quickScriptToAdDefaultValues,
    ...quickScriptToAdSetters,
    ...quickVoiceToAdSetters,
    ...advancedScriptToAdDefaultValues,
    ...advancedScriptToAdSetters,
    ...userInputMethods,
    reset: () =>
      set({
        ...defaultState,
        ...quickVoiceToAdDefaultValues,
        ...quickScriptToAdDefaultValues,
        ...advancedScriptToAdDefaultValues,
      }),
  };
});

export default useUserInputsStore;

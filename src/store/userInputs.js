// Relative path: src/store/userInputs.js
import { create } from "zustand";
import { defaultState } from "./default_state";
import { UserInputMethods } from "./methods/generic_states";

import {
  quickVoiceToAdDefaultValues,
  QuickVoiceToAdSetters,
} from "@/store/features/core/quick/voice-to-ad";

import {
  advancedScriptToAdDefaultValues,
  AdvancedScriptToAdSetters,
} from "@/store/features/core/advanced/script-to-ad";

const useUserInputsStore = create((set) => {
  const userInputMethods = new UserInputMethods(set);
  const voiceToAdSetters = new QuickVoiceToAdSetters(set);
  const advancedScriptToAdSetters = new AdvancedScriptToAdSetters(set);

  return {
    ...defaultState,
    ...quickVoiceToAdDefaultValues,
    ...advancedScriptToAdDefaultValues,
    ...userInputMethods,
    ...voiceToAdSetters,
    ...advancedScriptToAdSetters,
    reset: () =>
      set({
        ...defaultState,
        ...quickVoiceToAdDefaultValues,
        ...advancedScriptToAdDefaultValues,
      }),
  };
});

export default useUserInputsStore;

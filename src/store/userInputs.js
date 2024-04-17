// Relative path: src/store/userInputs.js
import { create } from "zustand";
import { defaultState } from "./default_state";
import { UserInputMethods } from "./methods/generic_states";
import quickVoiceToAdDefaultValues from "./features/core/quick/voice-to-ad/defaut_values";
import { QuickVoiceToAdSetters } from "./features/core/quick/voice-to-ad/setters";

const useUserInputsStore = create((set) => {
  const userInputMethods = new UserInputMethods(set);
  const voiceToAdSetters = new QuickVoiceToAdSetters(set);

  return {
    ...defaultState,
    ...quickVoiceToAdDefaultValues,
    ...userInputMethods,
    ...voiceToAdSetters,
    reset: () => set({ ...defaultState, ...quickVoiceToAdDefaultValues }),
  };
});

export default useUserInputsStore;

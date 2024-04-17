// Relative path: src/store/userInputs.js
import { create } from "zustand";
import { defaultState } from "./default_state";
import { UserInputMethods } from "./methods/generic_states";
import voiceToAdDefaultValues from "./features/core/quick/voice-to-ad/defaut_values";
import { VoiceToAdSetters } from "./features/core/quick/voice-to-ad/setters";

const useUserInputsStore = create((set) => {
  const userInputMethods = new UserInputMethods(set);
  const voiceToAdSetters = new VoiceToAdSetters(set);

  return {
    ...defaultState,
    ...voiceToAdDefaultValues,
    ...userInputMethods,
    ...voiceToAdSetters,
    reset: () => set({ ...defaultState, ...voiceToAdDefaultValues }),
  };
});

export default useUserInputsStore;

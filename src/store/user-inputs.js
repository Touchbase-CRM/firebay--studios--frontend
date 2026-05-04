import { create } from "zustand";
import { defaultState } from "./shared-default-values";
import { UserInputMethods } from "./shared-setters";
import {
  advancedScriptToAdDefaultValues,
  AdvancedScriptToAdSetters,
} from "@/store/features/core/advanced/script-to-ad";

const useUserInputsStore = create((set) => {
  const userInputMethods = new UserInputMethods(set);
  const advancedScriptToAdSetters = new AdvancedScriptToAdSetters(set);

  return {
    ...defaultState,
    ...advancedScriptToAdDefaultValues,
    ...advancedScriptToAdSetters,
    ...userInputMethods,
    reset: () =>
      set({
        ...defaultState,
        ...advancedScriptToAdDefaultValues,
      }),
  };
});

export default useUserInputsStore;

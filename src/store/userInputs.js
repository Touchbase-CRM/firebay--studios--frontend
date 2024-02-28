// store/userInputs.js
import { create } from "zustand";
import { defaultState } from "./default_state";
import { UserInputMethods } from "./methods/generic_states";

const useUserInputsStore = create((set) => {
  const userInputMethods = new UserInputMethods(set);

  return {
    ...defaultState,
    ...userInputMethods,
    reset: () => set({ ...defaultState }),
  };
});

export default useUserInputsStore;

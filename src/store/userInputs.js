// store/userInputs.js
import { create } from "zustand";
import { defaultState } from "./default_state";
import { QueueMethods } from "./methods/queue";
import { SectionMethods } from "./methods/section";
import { SectionArrayMethods } from "./methods/section_array";
import { UserInputMethods } from "./methods/generic_states";

const useUserInputsStore = create((set) => {
  const queueMethods = new QueueMethods(set);
  const sectionMethods = new SectionMethods(set);
  const sectionArrayMethods = new SectionArrayMethods(set);
  const userInputMethods = new UserInputMethods(set);

  return {
    ...defaultState,
    ...queueMethods,
    ...sectionMethods,
    ...sectionArrayMethods,
    ...userInputMethods,
    reset: () => set({ ...defaultState }),
  };
});

export default useUserInputsStore;

// src/store/methods/SectionMethods.js
import { produce } from "immer";
import { Section } from "../../dataStructures/section";

export class SectionMethods {
  constructor(set) {
    this.set = set;
  }

  setCurrentSectionObj(index) {
    this.set({ currentSectionObj: index });
  }

  setSectionObjDuration(newDuration) {
    this.set(
      produce((state) => {
        const currentObj = state.currentSectionObj;
        // Update the duration
        currentObj.setSectionDurationSeconds(newDuration);

        // Create a new Section with updated values
        state.currentSectionObj = new Section(
          currentObj.getIndex(),
          currentObj.getOriginalContent(),
          currentObj.getHistoryItemId(),
          newDuration // Use the updated duration
        );
      })
    );
  }
}

// src/store/methods/SectionMethods.js
import { produce } from "immer";
import { Section } from "../../dataStructures/section";

export class SectionMethods {
  constructor(set) {
    this.set = set;
    // Bind all methods to the current instance
    this.setCurrentSectionObj = this.setCurrentSectionObj.bind(this);
    this.setSectionObjDuration = this.setSectionObjDuration.bind(this);
  }

  setCurrentSectionObj(index) {
    this.set({ currentSectionObj: index });
  }

  setSectionObjDuration(newDuration) {
    this.set(
      produce((state) => {
        const currentObj = state.currentSectionObj;
        // Update the duration
        currentObj.setSectionDurationSecondsZustand(newDuration);

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

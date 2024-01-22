// src/store/methods/SectionMethods.js
import { produce } from "immer";
import { Section } from "../../dataStructures/section";

export class SectionMethods {
  constructor(set) {
    this.set = set;
    // Bind all methods to the current instance
    this.setCurrentSectionObjZustand =
      this.setCurrentSectionObjZustand.bind(this);
    this.setSectionObjDurationZustand =
      this.setSectionObjDurationZustand.bind(this);
    this.setSectionHistoryItemIdZustand =
      this.setSectionHistoryItemIdZustand.bind(this);
    this.setSectionCurrentContentZustand =
      this.setSectionCurrentContentZustand.bind(this);
    this.updateMultiplePropertiesSimultaneouslyZustand =
      this.updateMultiplePropertiesSimultaneouslyZustand.bind(this);
  }

  setCurrentSectionObjZustand(index) {
    this.set({ currentSectionObj: index });
  }

  setSectionObjDurationZustand(newDuration) {
    this.set(
      produce((state) => {
        const currentObj = state.currentSectionObj;
        // Update the duration
        currentObj.setSectionDurationSeconds(newDuration);

        // Create a new Section with updated values
        state.currentSectionObj = new Section(
          currentObj.getIndex(),
          currentObj.getOriginalContent(),
          currentObj.getCurrentContent(),
          currentObj.getHistoryItemId(),
          newDuration // Use the updated duration
        );
      })
    );
  }

  setSectionHistoryItemIdZustand(newHistoryItemId) {
    this.set(
      produce((state) => {
        const currentObj = state.currentSectionObj;

        // Update the history item ID
        currentObj.setHistoryItemId(newHistoryItemId);

        // Create a new Section with updated values
        state.currentSectionObj = new Section(
          currentObj.getIndex(),
          currentObj.getOriginalContent(),
          currentObj.getCurrentContent(),
          newHistoryItemId, // Use the updated history item ID
          currentObj.getSectionDurationSeconds()
        );
      })
    );
  }
  setSectionCurrentContentZustand(newContent) {
    this.set(
      produce((state) => {
        const currentObj = state.currentSectionObj;
        // Update the content
        currentObj.setCurrentContent(newContent);
        // Create a new Section with updated values
        state.currentSectionObj = new Section(
          currentObj.getIndex(),
          currentObj.getOriginalContent(),
          newContent,
          currentObj.getHistoryItemId(),
          currentObj.getSectionDurationSeconds()
        );
      })
    );
  }
  updateMultiplePropertiesSimultaneouslyZustand(
    newContent,
    newHistoryItemId,
    newDuration
    /**
     * Updates multiple properties of an object simultaneously. Used for multi value change
     * to avoid async issues.
     *
     * @param {any} newContent - the new content to set
     * @param {any} newHistoryItemId - the new history item id to set
     * @param {any} newDuration - the new duration to set
     * @return {void}
     */
  ) {
    this.set(
      produce((state) => {
        const currentObj = state.currentSectionObj;

        // Apply updates only if values are provided
        if (newContent !== undefined) {
          currentObj.setCurrentContent(newContent);
        }
        if (newHistoryItemId !== undefined) {
          currentObj.setHistoryItemId(newHistoryItemId);
        }
        if (newDuration !== undefined) {
          currentObj.setSectionDurationSeconds(newDuration);
        }

        // Recreate the Section with potentially updated values
        state.currentSectionObj = new Section(
          currentObj.getIndex(),
          currentObj.getOriginalContent(),
          newContent !== undefined
            ? newContent
            : currentObj.getCurrentContent(),
          newHistoryItemId !== undefined
            ? newHistoryItemId
            : currentObj.getHistoryItemId(),
          newDuration !== undefined
            ? newDuration
            : currentObj.getSectionDurationSeconds()
        );
      })
    );
  }
}

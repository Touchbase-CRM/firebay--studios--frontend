// src/store/methods/SectionArrayMethods.js
import { produce } from "immer";
import { Section } from "../../dataStructures/section";

export class SectionArrayMethods {
  constructor(set) {
    this.set = set;
    // Bind all methods to the current instance
    this.addToSectionArrayZustand = this.addToSectionArrayZustand.bind(this);
    this.setSectionArrayHistoryItemIdZustand =
      this.setSectionArrayHistoryItemIdZustand.bind(this);
    this.updateSectionArrayContentZustand =
      this.updateSectionArrayContentZustand.bind(this);
    this.setSectionArrayDurationSecondsZustand =
      this.setSectionArrayDurationSecondsZustand.bind(this);
  }

  addToSectionArrayZustand(sectionObject) {
    this.set((state) => {
      const newState = [...state.sectionsArray, sectionObject];
      return {
        sectionsArray: newState,
      };
    });
  }

  setSectionArrayHistoryItemIdZustand(index, newHistoryItemId) {
    this.set(
      produce((state) => {
        const sectionIndex = state.sectionsArray.findIndex(
          (section) => section.getIndex() === index
        );
        if (sectionIndex === -1) return;

        // Clone the section and update the history item ID
        const updatedSection = new Section(
          state.sectionsArray[sectionIndex].getIndex(),
          state.sectionsArray[sectionIndex].getOriginalContent(),
          state.sectionsArray[sectionIndex].getCurrentContent(),
          newHistoryItemId,
          state.sectionsArray[sectionIndex].getSectionDurationSeconds()
        );

        // Replace the section in the array with the updated one
        state.sectionsArray[sectionIndex] = updatedSection;
      })
    );
  }

  updateSectionArrayContentZustand(index, newContent) {
    this.set((state) => {
      const sectionIndex = state.sectionsArray.findIndex(
        (section) => section.getIndex() === index
      );
      if (sectionIndex === -1) return;

      const currentSection = state.sectionsArray[sectionIndex];
      const updatedSection = new Section(
        currentSection.getIndex(),
        currentSection.getOriginalContent(),
        newContent,
        currentSection.getHistoryItemId()
      );

      const newSectionsArray = [...state.sectionsArray];
      newSectionsArray[sectionIndex] = updatedSection;

      return { sectionsArray: newSectionsArray };
    });
  }

  setSectionArrayDurationSecondsZustand(newSectionDurationSeconds, index) {
    this.set((state) => {
      const sectionIndex = state.sectionsArray.findIndex(
        (section) => section.getIndex() === index
      );
      if (sectionIndex === -1) return;

      const currentSection = state.sectionsArray[sectionIndex];
      const updatedSection = new Section(
        currentSection.getIndex(),
        currentSection.getOriginalContent(),
        currentSection.getCurrentContent(),
        currentSection.getHistoryItemId(),
        newSectionDurationSeconds
      );

      const newSectionsArray = [...state.sectionsArray];
      newSectionsArray[sectionIndex] = updatedSection;

      return { sectionsArray: newSectionsArray };
    });
  }
}

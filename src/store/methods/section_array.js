// src/store/methods/SectionArrayMethods.js
import { produce } from "immer";
import { Section } from "../../dataStructures/section";

export class SectionArrayMethods {
  constructor(set) {
    this.set = set;
    // Bind all methods to the current instance
    this.addSectionZustand = this.addSectionZustand.bind(this);
    this.setSectionHistoryItemIdZustand =
      this.setSectionHistoryItemIdZustand.bind(this);
    this.updateSectionContentZustand =
      this.updateSectionContentZustand.bind(this);
    this.setSectionDurationSecondsZustand =
      this.setSectionDurationSecondsZustand.bind(this);
  }

  addSectionZustand(sectionObject) {
    this.set((state) => ({
      sectionsArray: [...state.sectionsArray, sectionObject],
    }));
  }

  setSectionHistoryItemIdZustand(index, newHistoryItemId) {
    this.set((state) => {
      const sectionIndex = state.sectionsArray.findIndex(
        (section) => section.getIndex() === index
      );
      if (sectionIndex === -1) return;

      const updatedSection = { ...state.sectionsArray[sectionIndex] };
      updatedSection.setHistoryItemId(newHistoryItemId);

      const newSectionsArray = [...state.sectionsArray];
      newSectionsArray[sectionIndex] = updatedSection;

      return { sectionsArray: newSectionsArray };
    });
  }

  updateSectionContentZustand(index, newContent) {
    this.set((state) => {
      const sectionIndex = state.sectionsArray.findIndex(
        (section) => section.getIndex() === index
      );
      if (sectionIndex === -1) return;

      const currentSection = state.sectionsArray[sectionIndex];
      const updatedSection = new Section(
        currentSection.getIndex(),
        newContent,
        currentSection.getHistoryItemId()
      );

      const newSectionsArray = [...state.sectionsArray];
      newSectionsArray[sectionIndex] = updatedSection;

      return { sectionsArray: newSectionsArray };
    });
  }

  setSectionDurationSecondsZustand(newSectionDurationSeconds, index) {
    this.set((state) => {
      const sectionIndex = state.sectionsArray.findIndex(
        (section) => section.getIndex() === index
      );
      if (sectionIndex === -1) return;

      const currentSection = state.sectionsArray[sectionIndex];
      const updatedSection = new Section(
        currentSection.getIndex(),
        currentSection.getContent(),
        currentSection.getHistoryItemId(),
        newSectionDurationSeconds
      );

      const newSectionsArray = [...state.sectionsArray];
      newSectionsArray[sectionIndex] = updatedSection;

      return { sectionsArray: newSectionsArray };
    });
  }
}

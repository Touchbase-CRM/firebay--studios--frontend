// src/store/methods/SectionArrayMethods.js
import { produce } from "immer";
import { Section } from "../../dataStructures/section";

export class SectionArrayMethods {
  constructor(set) {
    this.set = set;
    // Bind all methods to the current instance
    this.addSection = this.addSection.bind(this);
    this.setSectionHistoryItemId = this.setSectionHistoryItemId.bind(this);
    this.updateSectionContent = this.updateSectionContent.bind(this);
    this.setSectionDurationSeconds = this.setSectionDurationSeconds.bind(this);
  }

  addSection(sectionObject) {
    this.set((state) => ({
      sectionsArray: [...state.sectionsArray, sectionObject],
    }));
  }

  setSectionHistoryItemId(index, newHistoryItemId) {
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

  updateSectionContent(index, newContent) {
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

  setSectionDurationSeconds(newSectionDurationSeconds, index) {
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

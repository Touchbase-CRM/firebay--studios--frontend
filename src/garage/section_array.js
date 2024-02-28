// src/store/methods/SectionArrayMethods.js
import { produce } from "immer";
import { Section } from "../../dataStructures/section";

export class SectionArrayMethods {
  constructor(set) {
    this.set = set;
    // Bind all methods to the current instance
    this.addToSectionArrayZustand = this.addToSectionArrayZustand.bind(this);
  }

  addToSectionArrayZustand(sectionObject) {
    this.set((state) => {
      const newState = [...state.sectionsArray, sectionObject];
      return {
        sectionsArray: newState,
      };
    });
  }
}

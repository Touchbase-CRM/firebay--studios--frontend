import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultState } from "./shared-default-values";
import { UserInputMethods } from "./shared-setters";
import {
  advancedScriptToAdDefaultValues,
  AdvancedScriptToAdSetters,
} from "@/store/features/core/advanced/script-to-ad";
import { Section } from "@/data-structures/section";

const PERSISTED_KEYS = [
  ...Object.keys(defaultState),
  "s2aAdvancedFreeStyleStatus",
  "sectionsArray",
  "sectionHistoryArray",
  "stitchedAudioPyroHistoryItemId",
  "numSectionsIdentified",
];

const replacer = (_key, value) => {
  if (value instanceof Section) {
    return { __type: "Section", data: value.serialize() };
  }
  if (value instanceof Map) {
    return { __type: "Map", entries: Array.from(value.entries()) };
  }
  return value;
};

const reviver = (_key, value) => {
  if (value && typeof value === "object" && value.__type === "Section") {
    return Section.deserialize(value.data);
  }
  if (value && typeof value === "object" && value.__type === "Map") {
    return new Map(value.entries);
  }
  return value;
};

const jsonStorage = {
  getItem: (name) => {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(name);
    if (!raw) return null;
    return JSON.parse(raw, reviver);
  },
  setItem: (name, value) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(name, JSON.stringify(value, replacer));
  },
  removeItem: (name) => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(name);
  },
};

const useUserInputsStore = create(
  persist(
    (set) => {
      const userInputMethods = new UserInputMethods(set);
      const advancedScriptToAdSetters = new AdvancedScriptToAdSetters(set);

      return {
        ...defaultState,
        ...advancedScriptToAdDefaultValues,
        ...advancedScriptToAdSetters,
        ...userInputMethods,
        reset: () => {
          set({
            ...defaultState,
            ...advancedScriptToAdDefaultValues,
          });
          if (typeof window !== "undefined") {
            useUserInputsStore.persist.clearStorage();
          }
        },
      };
    },
    {
      name: "pyro-user-inputs",
      version: 1,
      storage: jsonStorage,
      partialize: (state) =>
        PERSISTED_KEYS.reduce((acc, key) => {
          if (key in state) acc[key] = state[key];
          return acc;
        }, {}),
    }
  )
);

export default useUserInputsStore;

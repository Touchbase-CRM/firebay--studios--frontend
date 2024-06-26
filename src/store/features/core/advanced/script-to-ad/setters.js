// Relative path: src/store/features/core/advanced/script-to-ad/setters.js

export class AdvancedScriptToAdSetters {
  constructor(set) {
    this.set = set;

    // Binding methods to ensure 'this' context
    this.setS2aAdvancedFreeStyleStatus =
      this.setS2aAdvancedFreeStyleStatus.bind(this);
    this.setSectionHistoryArray = this.setSectionHistoryArray.bind(this);
    this.setStitchedAudioPyroHistoryItemId =
      this.setStitchedAudioPyroHistoryItemId.bind(this);
    this.setNumSectionsIdentified = this.setNumSectionsIdentified.bind(this);
    this.setSectionsArray = this.setSectionsArray.bind(this);
    this.setNavigationStack = this.setNavigationStack.bind(this);
    this.setS2aAdvancedRememberVoice =
      this.setS2aAdvancedRememberVoice.bind(this);
    this.setS2aAdvancedDefaultVoice =
      this.setS2aAdvancedDefaultVoice.bind(this);
  }
  setS2aAdvancedDefaultVoice(defaultVoice) {
    this.set({ s2aAdvancedDefaultVoice: defaultVoice });
  }
  setS2aAdvancedRememberVoice(rememberVoice) {
    this.set({ s2aAdvancedRememberVoice: rememberVoice });
  }

  setNavigationStack(navigationStack) {
    this.set({ navigationStack });
  }

  setSectionsArray(sectionsArray) {
    this.set({ sectionsArray });
  }

  setS2aAdvancedFreeStyleStatus(status) {
    this.set({ s2aAdvancedFreeStyleStatus: status });
  }

  setSectionHistoryArray(sectionHistoryArray) {
    this.set({ sectionHistoryArray });
  }

  setStitchedAudioPyroHistoryItemId(stitchedAudioPyroHistoryItemId) {
    this.set({ stitchedAudioPyroHistoryItemId });
  }
  setNumSectionsIdentified(numSectionsIdentified) {
    this.set({ numSectionsIdentified });
  }
}

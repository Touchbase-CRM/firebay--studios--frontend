export class UserInputMethods {
  constructor(set) {
    this.set = set;

    // Binding all methods to the class instance
    this.setOgScriptWordsArray = this.setOgScriptWordsArray.bind(this);
    this.setOriginalScriptString = this.setOriginalScriptString.bind(this);
    this.setTransformedWords = this.setTransformedWords.bind(this);
    this.setVoiceId = this.setVoiceId.bind(this);
    this.setVoiceName = this.setVoiceName.bind(this);
    this.setVoicePreviewFilename = this.setVoicePreviewFilename.bind(this);
    this.setAdLength = this.setAdLength.bind(this);
    this.setAdSecondsConsumed = this.setAdSecondsConsumed.bind(this);
    this.setChosenMusic = this.setChosenMusic.bind(this);
    this.setMusicVol = this.setMusicVol.bind(this);
    this.setPreviewFileName = this.setPreviewFileName.bind(this);
    this.setBackgroundMusicFilename =
      this.setBackgroundMusicFilename.bind(this);
    this.setGeneratedVoiceUrl = this.setGeneratedVoiceUrl.bind(this);
    this.setHistoryItemId = this.setHistoryItemId.bind(this);
    this.setModelId = this.setModelId.bind(this);
    this.setNumSectionsIdentified = this.setNumSectionsIdentified.bind(this);
    this.setSectionsArray = this.setSectionsArray.bind(this);
    this.setStitchedAudioPyroHistoryItemId =
      this.setStitchedAudioPyroHistoryItemId.bind(this);
    this.setNavigationStack = this.setNavigationStack.bind(this);
    this.setSectionHistoryArray = this.setSectionHistoryArray.bind(this);
  }
  setSectionHistoryArray(sectionHistoryArray) {
    this.set({ sectionHistoryArray });
  }

  setNavigationStack(navigationStack) {
    this.set({ navigationStack });
  }

  setStitchedAudioPyroHistoryItemId(stitchedAudioPyroHistoryItemId) {
    this.set({ stitchedAudioPyroHistoryItemId });
  }

  setSectionsArray(sectionsArray) {
    this.set({ sectionsArray });
  }

  setNumSectionsIdentified(numSectionsIdentified) {
    this.set({ numSectionsIdentified });
  }

  setOgScriptWordsArray(ogScriptWordsArray) {
    this.set({ ogScriptWordsArray });
  }

  setOriginalScriptString(originalScriptString) {
    this.set({ originalScriptString });
  }

  setTransformedWords(transformedWords) {
    this.set({ transformedWords });
  }

  setVoiceId(voiceId) {
    this.set({ voiceId });
  }

  setVoiceName(voiceName) {
    this.set({ voiceName });
  }

  setVoicePreviewFilename(filename) {
    this.set({ voicePreviewFilename: filename });
  }

  setAdLength(adLength) {
    this.set({ adLength });
  }

  setAdSecondsConsumed(adSecondsConsumed) {
    this.set({ adSecondsConsumed });
  }

  setChosenMusic(chosenMusic) {
    this.set({ chosenMusic });
  }

  setMusicVol(musicVol) {
    this.set({ musicVol });
  }

  setPreviewFileName(previewFileName) {
    this.set({ previewFileName });
  }

  setBackgroundMusicFilename(backgroundMusicFilename) {
    this.set({ backgroundMusicFilename });
  }

  setGeneratedVoiceUrl(generatedVoiceUrl) {
    this.set({ generatedVoiceUrl });
  }

  setHistoryItemId(historyItemId) {
    this.set({ historyItemId });
  }

  setModelId(modelId) {
    this.set({ modelId });
  }
}

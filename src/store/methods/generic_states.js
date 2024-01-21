// src/store/methods/UserInputMethods.js

export class UserInputMethods {
  constructor(set) {
    this.set = set;
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

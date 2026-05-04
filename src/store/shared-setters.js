export class UserInputMethods {
  constructor(set) {
    this.set = set;

    this.setOgScriptWordsArray = this.setOgScriptWordsArray.bind(this);
    this.setOriginalScriptString = this.setOriginalScriptString.bind(this);
    this.setTransformedWords = this.setTransformedWords.bind(this);
    this.setVoiceId = this.setVoiceId.bind(this);
    this.setVoiceName = this.setVoiceName.bind(this);
    this.setVoicePreviewFilename = this.setVoicePreviewFilename.bind(this);
    this.setAdLength = this.setAdLength.bind(this);
    this.setGeneratedVoiceUrl = this.setGeneratedVoiceUrl.bind(this);
    this.setModelId = this.setModelId.bind(this);
    this.setAdGenerationMethod = this.setAdGenerationMethod.bind(this);
    this.setSpotId = this.setSpotId.bind(this);
    this.setSpotName = this.setSpotName.bind(this);
  }

  setSpotName(spotName) { this.set({ spotName }); }
  setSpotId(spotId) { this.set({ spotId }); }
  setAdGenerationMethod(adGenerationMethod) { this.set({ adGenerationMethod }); }
  setOgScriptWordsArray(ogScriptWordsArray) { this.set({ ogScriptWordsArray }); }
  setOriginalScriptString(originalScriptString) { this.set({ originalScriptString }); }
  setTransformedWords(transformedWords) { this.set({ transformedWords }); }
  setVoiceId(voiceId) { this.set({ voiceId }); }
  setVoiceName(voiceName) { this.set({ voiceName }); }
  setVoicePreviewFilename(filename) { this.set({ voicePreviewFilename: filename }); }
  setAdLength(adLength) { this.set({ adLength }); }
  setGeneratedVoiceUrl(generatedVoiceUrl) { this.set({ generatedVoiceUrl }); }
  setModelId(modelId) { this.set({ modelId }); }
}

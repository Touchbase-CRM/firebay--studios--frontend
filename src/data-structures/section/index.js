// Relative path: src/dataStructures/section/index.js
import {
  fetchAudioFromPyroBackendDistribution,
  fetchAudioFromElevenLabs,
} from "@/utils/fetch-audio/fetch-from-distribution";

export class Section {
  constructor(
    index,
    originalContent,
    currentContent,
    historyItemId = null,
    sectionDurationSeconds = 0
  ) {
    this.index = index;
    this.signature = "fsCustomClass";
    this.originalContent = originalContent;
    this.currentContent = currentContent;
    this.currentTransformations = {}; // transformed words with indexes
    this.currentWords = originalContent.split(" "); // the raw words of the transformed words above.
    this.historyItemId = historyItemId;
    this.originalCharCount = this.#calculateCharCount(originalContent);
    this.currentCharCount = this.#calculateCharCount(currentContent);
    this.sectionDurationSeconds = sectionDurationSeconds;
    this.endOfSectionPauseDurationSeconds = 0.2;
    this.speechRate = "Normal";
    this.modelId = "eleven_multilingual_v2";
    this.voiceId = "6wLJ4Wm2OxvAvetEUBCS";
    this.voiceName = "Charley";
    this.voicePreviewFilename = "male/charley.mp3";
    this.dragonBreathEnhancement = false;
    this.generatedVoiceUrl = "";
  }

  clone() {
    // Create a new instance with basic properties set via constructor
    const cloned = new Section(
      this.index,
      this.originalContent,
      this.currentContent,
      this.historyItemId,
      this.sectionDurationSeconds
    );

    // Use setters for properties that have additional logic or consistency requirements
    cloned.signature = this.signature;
    cloned.setCurrentTransformations({ ...this.currentTransformations });
    cloned.setCurrentWords([...this.currentWords]);
    cloned.setGeneratedVoiceUrl(this.generatedVoiceUrl);
    cloned.setVoicePreviewFilename(this.voicePreviewFilename);
    cloned.setDragonBreathEnhancement(this.dragonBreathEnhancement);
    cloned.setVoiceName(this.voiceName);
    cloned.setVoiceId(this.voiceId);
    cloned.setModelId(this.modelId);
    cloned.setSpeechRate(this.speechRate);
    cloned.setEndOfSectionPauseDurationSeconds(
      this.endOfSectionPauseDurationSeconds
    );
    cloned.setSectionDurationSeconds(this.sectionDurationSeconds);

    return cloned;
  }

  serialize() {
    return {
      index: this.index,
      signature: this.signature,
      originalContent: this.originalContent,
      currentContent: this.currentContent,
      historyItemId: this.historyItemId,
      sectionDurationSeconds: this.sectionDurationSeconds,
      endOfSectionPauseDurationSeconds: this.endOfSectionPauseDurationSeconds,
      speechRate: this.speechRate,
      modelId: this.modelId,
      voiceId: this.voiceId,
      voiceName: this.voiceName,
      voicePreviewFilename: this.voicePreviewFilename,
      dragonBreathEnhancement: this.dragonBreathEnhancement,
      generatedVoiceUrl: this.generatedVoiceUrl,
      currentTransformations: this.currentTransformations,
      currentWords: this.currentWords,
    };
  }

  static deserialize(data) {
    const section = new Section(
      data.index,
      data.originalContent,
      data.currentContent,
      data.historyItemId,
      data.sectionDurationSeconds
    );

    section.setEndOfSectionPauseDurationSeconds(
      data.endOfSectionPauseDurationSeconds
    );
    section.setSpeechRate(data.speechRate);
    section.setModelId(data.modelId);
    section.setVoiceId(data.voiceId);
    section.setVoiceName(data.voiceName);
    section.setVoicePreviewFilename(data.voicePreviewFilename);
    section.setDragonBreathEnhancement(data.dragonBreathEnhancement);
    section.setGeneratedVoiceUrl(data.generatedVoiceUrl);
    section.setCurrentTransformations(data.currentTransformations);
    section.setCurrentWords(data.currentWords);

    return section;
  }

  //setter for currentWords
  setCurrentWords(newCurrentWords) {
    this.currentWords = newCurrentWords;
  }
  //getter for currentWords
  getCurrentWords() {
    return this.currentWords;
  }

  // setter for current transformations
  setCurrentTransformations(newCurrentTransformations) {
    this.currentTransformations = newCurrentTransformations;
  }
  // getter for current transformations
  getCurrentTransformations() {
    return this.currentTransformations;
  }

  // setter for generated voice url
  setGeneratedVoiceUrl(newGeneratedVoiceUrl) {
    this.generatedVoiceUrl = newGeneratedVoiceUrl;
  }
  // getter for generated voice url
  getGeneratedVoiceUrl() {
    return this.generatedVoiceUrl;
  }

  // setter for voice preview filename
  setVoicePreviewFilename(newVoicePreviewFilename) {
    this.voicePreviewFilename = newVoicePreviewFilename;
  }
  // getter for voice preview filename
  getVoicePreviewFilename() {
    return this.voicePreviewFilename;
  }

  // setter for dragon breath enhancement
  setDragonBreathEnhancement(newDragonBreathEnhancement) {
    this.dragonBreathEnhancement = newDragonBreathEnhancement;
  }
  // getter for dragon breath enhancement
  getDragonBreathEnhancement() {
    return this.dragonBreathEnhancement;
  }

  // setter for voice name
  setVoiceName(newVoiceName) {
    this.voiceName = newVoiceName;
  }
  // getter for voice name
  getVoiceName() {
    return this.voiceName;
  }

  // setter for voice id
  setVoiceId(newVoiceId) {
    this.voiceId = newVoiceId;
  }
  // getter for voice id
  getVoiceId() {
    return this.voiceId;
  }
  // setter for model id
  setModelId(newModelId) {
    this.modelId = newModelId;
  }
  // getter for model id
  getModelId() {
    return this.modelId;
  }

  setSpeechRate(newSpeechRate) {
    const allowedRates = ["Normal", "1.25X", "1.5X", "1.75X", "2X"];
    if (allowedRates.includes(newSpeechRate)) {
      this.speechRate = newSpeechRate;
    } else {
      console.log(
        "Speech rate is not allowed. Please choose one of the following: Normal, 1.25X, 1.5X, 1.75X, 2X."
      );
    }
  }

  getSpeechRate() {
    return this.speechRate;
  }

  // setter for end of section pause duration
  setEndOfSectionPauseDurationSeconds(newEndOfSectionPauseDurationSeconds) {
    this.endOfSectionPauseDurationSeconds = newEndOfSectionPauseDurationSeconds;
  }

  //getter for end of section pause duration
  getEndOfSectionPauseDurationSeconds() {
    return this.endOfSectionPauseDurationSeconds;
  }

  // Private method to calculate character count
  #calculateCharCount(content) {
    // Replace all apostrophes with an empty string before calculating the length
    const contentWithoutApostrophes = content.replace(/'/g, "");
    return contentWithoutApostrophes.trim().length;
  }

  // Getter for current content
  getCurrentContent() {
    return this.currentContent;
  }

  // Getter for original content (immutable)
  getOriginalContent() {
    return this.originalContent;
  }

  // Getter for original character count (immutable)
  getOriginalCharCount() {
    return this.originalCharCount;
  }

  // Getter for current character count
  getCurrentCharCount() {
    return this.currentCharCount;
  }

  //setter for index
  setIndex(newIndex) {
    this.index = newIndex;
  }

  // Getter for index
  getIndex() {
    return this.index;
  }

  // Getter for history item ID
  getHistoryItemId() {
    return this.historyItemId;
  }

  // Setter for history item ID
  setHistoryItemId(newHistoryItemId) {
    this.historyItemId = newHistoryItemId;
  }
  setCurrentContent(newContent) {
    this.currentContent = newContent;
  }

  // Getter for section duration in seconds
  getSectionDurationSeconds() {
    return this.sectionDurationSeconds;
  }

  // Setter for section duration in seconds
  setSectionDurationSeconds(newSectionDurationSeconds) {
    this.sectionDurationSeconds = newSectionDurationSeconds;
  }

  // Method to update audio URL when the blob url is expired.
  async updateAudioUrl(estimatedProcessingTime = 0, maxRetries = 3) {
    if (!this.historyItemId) {
      console.log("History item ID is not set.");
      return;
    }
    try {
      let audioUrl;
      if (this.historyItemId.startsWith("pyro_")) {
        audioUrl = await fetchAudioFromPyroBackendDistribution(
          this.historyItemId,
          estimatedProcessingTime,
          maxRetries
        );
      } else {
        audioUrl = await fetchAudioFromElevenLabs(this.historyItemId);
      }
      this.setGeneratedVoiceUrl(audioUrl);
    } catch (error) {
      console.error("Failed to update audio URL:", error.message);
    }
  }
}

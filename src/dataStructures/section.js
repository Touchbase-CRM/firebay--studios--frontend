export class Section {
  constructor(
    index,
    originalContent,
    currentContent,
    historyItemId = null,
    sectionDurationSeconds = 0
  ) {
    this.index = index;
    this.originalContent = originalContent;
    this.currentContent = currentContent;
    this.historyItemId = historyItemId;
    this.originalCharCount = this.#calculateCharCount(originalContent);
    this.currentCharCount = this.#calculateCharCount(currentContent);
    this.sectionDurationSeconds = sectionDurationSeconds;
    this.endOfSectionPauseDurationSeconds = 0.2;
    this.speechRate = "Normal";
    this.modelId = "eleven_monolingual_v1";
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
    return content.trim().length;
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
}

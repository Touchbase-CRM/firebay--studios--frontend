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

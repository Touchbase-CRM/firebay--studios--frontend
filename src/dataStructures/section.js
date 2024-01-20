class Section {
  constructor(index, originalContent, historyItemId = null) {
    this.index = index;
    this.originalContent = originalContent;
    this.currentContent = originalContent;
    this.historyItemId = historyItemId;
    this.originalWordCount = this.#calculateWordCount(originalContent);
    this.currentWordCount = this.originalWordCount;
  }
  // private method
  #calculateWordCount(content) {
    return content.split(/\s+/).filter(Boolean).length;
  }

  updateContent(newContent) {
    this.currentContent = newContent;
    this.currentWordCount = this.#calculateWordCount(newContent);
  }

  // Getter for original content (immutable)
  getOriginalContent() {
    return this.originalContent;
  }

  // Getter for original word count (immutable)
  getOriginalWordCount() {
    return this.originalWordCount;
  }

  // Getter for current word count
  getCurrentWordCount() {
    return this.currentWordCount;
  }

  // Getter for history item ID
  getHistoryItemId() {
    return this.historyItemId;
  }
  // Setter for history item ID
  setHistoryItemId(newHistoryItemId) {
    this.historyItemId = newHistoryItemId;
  }
}

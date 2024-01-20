export class Section {
  constructor(index, originalContent, historyItemId = null) {
    this.index = index;
    this.originalContent = originalContent;
    this.currentContent = originalContent;
    this.historyItemId = historyItemId;
    this.originalCharCount = this.#calculateCharCount(originalContent);
    this.currentCharCount = this.originalCharCount;
  }

  // Private method to calculate character count
  #calculateCharCount(content) {
    return content.trim().length;
  }

  updateContent(newContent) {
    this.currentContent = newContent;
    this.currentCharCount = this.#calculateCharCount(newContent);
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
}

// Relative path: src/store/features/core/quick/script-to-ad/setters.js

export class QuickScriptToAdSetters {
  constructor(set) {
    this.set = set;
    this.setHistoryItemId = this.setHistoryItemId.bind(this);
  }

  setHistoryItemId(historyItemId) {
    this.set({ historyItemId });
  }
}

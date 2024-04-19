// Relative path: src/store/features/core/advanced/script-to-ad/setters.js

export class AdvancedScriptToAdSetters {
  constructor(set) {
    this.set = set;

    // Binding methods to ensure 'this' context
    this.setS2aAdvancedFreeStyleStatus =
      this.setS2aAdvancedFreeStyleStatus.bind(this);
  }

  setS2aAdvancedFreeStyleStatus(status) {
    this.set({ s2aAdvancedFreeStyleStatus: status });
  }
}

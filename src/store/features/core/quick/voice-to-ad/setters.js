// src/store/features/core/quick/voice-to-ad/setters.js

// Class for voice-to-ad setter functions
export class QuickVoiceToAdSetters {
  constructor(set) {
    this.set = set;

    // Binding methods to ensure 'this' context
    this.setV2aUploadedAudioUrl = this.setV2aUploadedAudioUrl.bind(this);
    this.setV2aQuickUploadedFile = this.setV2aQuickUploadedFile.bind(this);
    this.setv2aQuickGeneratedAudioBlob =
      this.setv2aQuickGeneratedAudioBlob.bind(this);
  }

  // Method to set the quick generated audio blob
  setv2aQuickGeneratedAudioBlob(blob) {
    this.set({ v2aQuickGeneratedAudioBlob: blob });
  }

  // Method to set the quick uploaded file
  setV2aQuickUploadedFile(file) {
    this.set({ v2aQuickUploadedFile: file });
  }

  // Method to set the uploaded audio URL
  setV2aUploadedAudioUrl(url) {
    this.set({ v2aUploadedAudioUrl: url });
  }
}

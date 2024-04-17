// src/store/features/core/quick/voice-to-ad/setters.js

// Class for voice-to-ad setter functions
export class QuickVoiceToAdSetters {
  constructor(set) {
    this.set = set;

    // Binding methods to ensure 'this' context
    this.setV2aUploadedAudioUrl = this.setV2aUploadedAudioUrl.bind(this);
  }

  // Method to set the uploaded audio URL
  setV2aUploadedAudioUrl(url) {
    this.set({ v2aUploadedAudioUrl: url });
  }
}

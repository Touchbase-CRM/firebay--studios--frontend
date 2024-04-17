// relative path: src/middleware/speechToSpeech.js
async function elevenlabsSTS(audioBlob, voiceId, modelId) {
  const formData = new FormData();
  formData.append("audio", audioBlob); // The file blob
  formData.append("voice_id", voiceId); // The ID of the voice to use
  formData.append("model_id", modelId); // The model ID, assuming this is also required
  try {
    const response = await fetch("/api/Elevenlabs/speechToSpeech", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);
    const localHistoryItemId = response.headers.get("history-item-id");

    return { audioUrl, localHistoryItemId };
  } catch (error) {
    console.error("Failed to generate voice:", error);
    throw error;
  }
}

export { elevenlabsSTS };

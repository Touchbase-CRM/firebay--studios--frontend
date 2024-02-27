const hostUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:8000"
    : "https://vgz580uujk.execute-api.us-east-2.amazonaws.com";
/**
 * Asynchronously generates a voice using the ElevenLabs API with the provided script, model ID, and voice ID.
 * This is a proxy function for now. When we start paying for Vercel, we should switch to the function above.
 *
 * @param {string} script - The script to be converted into voice.
 * @param {string} modelId - The ID of the model to be used for voice generation.
 * @param {string} voiceId - The ID of the voice to be used for voice generation.
 * @return {Promise<{audioUrl: string, localHistoryItemId: string}>} A promise that resolves to an object containing the audio URL and local history item ID.
 */
async function generateVoiceWithElevenLabsAPI(script, modelId, voiceId) {
  try {
    const response = await fetch(`${hostUrl}/proxy-generate-plain-voice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ script, model_id: modelId, voice_id: voiceId }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok.");
    }

    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);
    const localHistoryItemId = response.headers.get("history-item-id");

    return { audioUrl, localHistoryItemId };
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export { generateVoiceWithElevenLabsAPI };

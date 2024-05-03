import { fetchResourceFromS3 } from "../fetchAudio/fetchResourceFromS3";

export async function fetchAudioFromPyroBackendDistribution(
  pyroHistoryItemId,
  estimatedProcessingTime = 60000,
  maxRetries = 3
) {
  const bucketName = "workingdir--storage";
  const objectName = `primary--distribution/${pyroHistoryItemId}`;
  const retryInterval = 15000; // Interval between retries if needed

  let attempts = 0;
  while (attempts < maxRetries) {
    try {
      // Use the abstracted function to fetch the audio file
      const audioUrl = await fetchResourceFromS3(
        bucketName,
        objectName,
        estimatedProcessingTime
      );
      return audioUrl;
    } catch (error) {
      console.error(`Attempt #${attempts + 1} failed:`, error.message);
      attempts++;

      if (attempts >= maxRetries) {
        throw new Error(
          `Failed to fetch audio URL from API after ${maxRetries} attempts.`
        );
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryInterval));
    }
  }
}

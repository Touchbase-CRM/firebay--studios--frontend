export async function fetchAudioFromPyroBackendDistribution(
  pyroHistoryItemId,
  estimatedProcessingTime = 60000, // Assume a default estimated processing time
  maxRetries = 3
) {
  const bucketName = "workingdir--storage";
  const objectName = `primary--distribution/${pyroHistoryItemId}`;
  const retryInterval = 15000; // Interval between retries if needed

  let attempts = 0;
  while (attempts < maxRetries) {
    try {
      const response = await fetch("/api/S3/fetchAudioFromS3", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bucketName, objectName }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Wait for the estimated processing time after fetching the URL
      // to ensure the file is ready for use
      await new Promise((resolve) =>
        setTimeout(resolve, estimatedProcessingTime)
      );

      return data.url;
    } catch (error) {
      console.error(`Attempt #${attempts + 1} failed:`, error.message);
      attempts += 1;

      if (attempts < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryInterval));
      } else {
        throw new Error(
          `Failed to fetch audio URL from API after ${maxRetries} attempts.`
        );
      }
    }
  }
}

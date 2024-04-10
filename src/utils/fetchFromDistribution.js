// Relative path: utils/fetchFromDistribution.js

export async function fetchAudioFromPyroBackendDistribution(pyroHistoryItemId) {
  const bucketName = "workingdir--storage";
  const objectName = `primary--distribution/${pyroHistoryItemId}`;

  try {
    // Make a POST request to your API route, sending the object name to get the signed URL
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

    // Use the signed URL directly for audio playback or download
    // Here, return the URL for further use, such as setting it as the src for an audio element
    return data.url;
  } catch (error) {
    console.error("Error fetching audio URL from API:", error);
    throw new Error("Failed to fetch audio URL from API");
  }
}

// New image fetch function
//   export async function fetchImageFromPyroBackendDistributionWithPolling(pyroHistoryItemId) {
//     // Function implementation
//   }

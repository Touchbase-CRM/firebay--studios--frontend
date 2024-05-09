// Import the necessary components from the AWS SDK
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

// Initialize the S3 client within the function to use Next.js environment variables
const getS3Client = () => {
  return new S3Client({
    region: "us-east-2",
    credentials: {
      accessKeyId: "AKIAS6N3YON237ME2AOB", // Access the AWS access key ID from environment variables
      secretAccessKey: "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", // Access the AWS secret access key from environment variables
    },
  });
};

const fetchAudioFromPyroBackendDistribution = async (
  pyroHistoryItemId = "c505b41"
) => {
  const bucketName = "workingdir--storage"; // Specify your bucket name
  const objectName = `primary--distribution/${pyroHistoryItemId}`; // Specify the object key

  const s3Client = getS3Client(); // Initialize S3 client

  // Create a new instance of the GetObjectCommand
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: objectName,
  });

  try {
    // Send the command to S3
    const { Body } = await s3Client.send(command);

    // The response Body is a stream. Convert it to a Blob for the audio URL
    const audioBlob = await new Response(Body).blob();

    return audioBlob;
  } catch (error) {
    console.error("Error fetching audio from S3:", error);
    throw new Error("Failed to fetch audio from S3");
  }
};

// Main execution function
const main = async () => {
  const pyroHistoryItemId = "e54185d"; // Example item ID, replace or modify as needed
  try {
    const audioBlob = await fetchAudioFromPyroBackendDistribution(
      pyroHistoryItemId
    );
    console.log("Audio fetched successfully:", audioBlob);
    // Further processing here
  } catch (error) {
    console.error(error);
  }
};

main();

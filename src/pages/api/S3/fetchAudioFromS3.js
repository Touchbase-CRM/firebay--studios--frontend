// pages/api/fetchAudio.js
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { generatePyroOrderIdFromTimestamp } from "@/utils/time/current-timestamp";

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { bucketName, objectName } = req.body;

  // Create an S3 client (server-side)
  const s3Client = new S3Client({
    region: "us-east-2",
    credentials: {
      accessKeyId: process.env.MIN_PYRO_USER_AWS_ACCESS_KEY, // Access the AWS access key ID from environment variables
      secretAccessKey: process.env.MIN_PYRO_USER_AWS_SECRET_KEY, // Access the AWS secret access key from environment variables
    },
  });

  try {
    // Generate a signed URL for secure, temporary access to the object
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectName,
      ResponseContentDisposition: `attachment; filename="${generatePyroOrderIdFromTimestamp()}.mp3"`,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 86400, // URL expires in 24 hours
    });

    // Return the signed URL to the client
    return res.status(200).json({ url: signedUrl });
  } catch (error) {
    console.error("Error fetching audio from S3:", error);
    return res.status(500).json({ message: "Failed to fetch audio from S3" });
  }
}

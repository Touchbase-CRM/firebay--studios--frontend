import { IncomingForm } from "formidable";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";

export const config = {
  api: {
    bodyParser: false,
  },
};

// Asynchronous function to parse the form
async function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm();

    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject({ error: "Error parsing the form data.", status: 500 });
      }

      console.log(files); // Debugging: See the structure of `files`

      if (!files.audio || files.audio.length === 0) {
        return reject({ error: "No audio file provided.", status: 400 });
      }

      const audioFile = files.audio[0]; // Access the first file in the array
      if (!audioFile.filepath) {
        console.log("Received file info:", audioFile); // More debugging
        return reject({ error: "File path is undefined.", status: 400 });
      }

      resolve({ fields, files: { audio: audioFile } }); // Normalize the files object for the handler
    });
  });
}

export default async function handler(req, res) {
  try {
    const { fields, files } = await parseForm(req);
    const audioFile = files.audio; // Already a single file object after parseForm normalization

    const modelId = Array.isArray(fields.model_id)
      ? fields.model_id[0]
      : fields.model_id;
    const voiceId = Array.isArray(fields.voice_id)
      ? fields.voice_id[0]
      : fields.voice_id;

    // Logging to verify the types (temporary, for debugging)
    console.log("Model ID Type:", typeof modelId);
    console.log("Voice ID Type:", typeof voiceId);

    const audioStream = fs.createReadStream(audioFile.filepath);
    console.log("Audio File Path:", audioFile.filepath);
    console.log("Streaming Audio File:", audioFile.originalFilename);

    const formData = new FormData();
    formData.append("model_id", modelId); // Ensure it's a string
    formData.append("audio", audioStream, {
      filename: audioFile.originalFilename,
    });

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/speech-to-speech/${voiceId}`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          "xi-api-key": process.env.ELEVEN_LABS_API_KEY,
        },
        responseType: "stream",
      }
    );

    res.setHeader("Content-Type", response.headers["content-type"]);
    response.data.pipe(res);
  } catch (error) {
    console.error(error.error || "An error occurred:", error);
    res.status(error.status || 500).json({ error: error.error });
  }
}

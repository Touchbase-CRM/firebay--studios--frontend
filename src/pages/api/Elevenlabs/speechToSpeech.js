import { IncomingForm } from "formidable";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";

export const config = {
  api: {
    bodyParser: false,
  },
};

// Normalize fields to ensure no fields are arrays unless explicitly allowed
function normalizeFields(fields) {
  const normalizedFields = {};
  for (const key in fields) {
    normalizedFields[key] = Array.isArray(fields[key])
      ? fields[key][0]
      : fields[key];
  }
  return normalizedFields;
}

// Asynchronous function to parse the form
async function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm();

    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject({ error: "Error parsing the form data.", status: 500 });
      }

      if (!files.audio || files.audio.length === 0) {
        return reject({ error: "No audio file provided.", status: 400 });
      }

      const audioFile = files.audio[0];
      if (!audioFile.filepath) {
        return reject({ error: "File path is undefined.", status: 400 });
      }

      const normalizedFields = normalizeFields(fields);
      resolve({ fields: normalizedFields, files: { audio: audioFile } }); // Normalize the files object for the handler
    });
  });
}

export default async function handler(req, res) {
  try {
    const { fields, files } = await parseForm(req);
    const audioFile = files.audio; // Already a single file object after parseForm normalization
    const audioStream = fs.createReadStream(audioFile.filepath);

    const formData = new FormData();
    // Append all fields dynamically
    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append("audio", audioStream, {
      filename: audioFile.originalFilename,
    });

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/speech-to-speech/${fields.voice_id}?output_format=mp3_44100_192`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          "xi-api-key": process.env.ELEVEN_LABS_API_KEY,
        },
        responseType: "stream",
      }
    );
    res.setHeader("history-item-id", response.headers["history-item-id"]);
    res.setHeader("Content-Type", response.headers["content-type"]);
    response.data.pipe(res);
  } catch (error) {
    console.error(error.error || "An error occurred:", error);
    res.status(error.status || 500).json({ error: error.error });
  }
}

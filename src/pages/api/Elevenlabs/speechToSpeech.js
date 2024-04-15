//Relative path: src/pages/api/Elevenlabs/speechToSpeech.js

import FormData from "form-data";
import axios from "axios";
import formidable from "formidable-serverless";
import fs from "fs";

export const config = {
  maxDuration: 120,
  api: {
    bodyParser: false, // Disabling the default body parser
  },
};

export default function handler(req, res) {
  if (req.method === "POST") {
    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Could not parse the form data." });
        return;
      }

      const { model_id: modelId, voice_id: voiceId } = fields;

      const audioFile = files.audio;

      if (!audioFile) {
        res.status(400).json({ error: "No audio file provided." });
        return;
      }

      try {
        const formData = new FormData();

        formData.append("model_id", modelId);

        const audioStream = fs.createReadStream(audioFile.path);
        formData.append("audio", audioStream, {
          filename: audioFile.name,
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
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to process the audio file." });
      }
    });
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end("Method Not Allowed");
  }
}

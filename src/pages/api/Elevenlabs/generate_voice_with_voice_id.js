import axios from "axios";

export const config = {
  maxDuration: 60,
};

async function streamToString(stream) {
  if (!stream || typeof stream.on !== "function") {
    if (stream == null) return "";
    return typeof stream === "string" ? stream : JSON.stringify(stream);
  }
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { script, modelId, voiceId, voiceIntonationConsistency } = req.body;

    try {
      const dataPayload = {
        text: script,
        model_id: modelId,
      };

      if (
        typeof voiceIntonationConsistency !== "undefined" &&
        voiceIntonationConsistency !== null
      ) {
        dataPayload.voice_settings = {
          stability: voiceIntonationConsistency / 100,
          similarity_boost: 0.75,
        };
      }

      const options = {
        method: "post",
        url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_192`,
        headers: {
          "xi-api-key": process.env.ELEVEN_LABS_API_KEY, // Keep sensitive data server-side
          "Content-Type": "application/json",
        },
        data: JSON.stringify(dataPayload),
        responseType: "stream", // This is important to handle binary data like audio files
      };

      const response = await axios(options);

      // With axios, the headers and data are accessed differently
      const localHistoryItemId = response.headers["history-item-id"];

      // Set headers for the response to the client
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("history-item-id", localHistoryItemId); // Send history item ID in response headers

      // Stream the response data directly to the client
      response.data.pipe(res);
    } catch (err) {
      let upstreamBody = "";
      try {
        upstreamBody = await streamToString(err.response?.data);
      } catch (readErr) {
        upstreamBody = err.message;
      }
      const upstreamStatus = err.response?.status ?? 500;
      console.error("ElevenLabs proxy error (generate_voice_with_voice_id)", {
        status: upstreamStatus,
        body: upstreamBody,
        message: err.message,
      });
      res.status(upstreamStatus).json({
        error: "Failed to generate voice",
        upstreamStatus,
        upstreamMessage: upstreamBody || err.message,
      });
    }
  } else {
    // Handle any non-POST requests
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

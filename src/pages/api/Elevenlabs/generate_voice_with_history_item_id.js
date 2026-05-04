import axios from "axios";

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
    const { historyItemId } = req.body;

    try {
      const options = {
        method: "POST",
        url: "https://api.elevenlabs.io/v1/history/download",
        headers: {
          "xi-api-key": process.env.ELEVEN_LABS_API_KEY,
          "Content-Type": "application/json",
        },
        data: JSON.stringify({ history_item_ids: [historyItemId] }),
        responseType: "stream", // Ensure the response is treated as a stream
      };

      const response = await axios(options);

      // Set headers for the response to the client
      res.setHeader("Content-Type", "audio/mpeg");
      // Optional: Include any other headers you might need

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
      console.error("ElevenLabs proxy error (generate_voice_with_history_item_id)", {
        status: upstreamStatus,
        body: upstreamBody,
        message: err.message,
      });
      res.status(upstreamStatus).json({
        error: "Failed to fetch audio from ElevenLabs",
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

const voice = require("elevenlabs-node");

export default async (req, res) => {
  const apiKey = process.env.ELEVEN_LABS_API_KEY;
  const voiceID = req.body.voiceId;
  const textInput = req.body.text;

  try {
    const audioStream = await voice.textToSpeechStream(apiKey, voiceID, textInput);
    res.setHeader('Content-Type', 'audio/mp3');
    audioStream.pipe(res);  // Send audio stream to client-side
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};

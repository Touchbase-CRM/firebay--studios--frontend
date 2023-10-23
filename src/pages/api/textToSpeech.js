// File: pages/api/textToSpeech.js
const voice = require("elevenlabs-node");

export default async (req, res) => {
  const apiKey = process.env.ELEVEN_LABS_API_KEY;  // Access your API key from environment variables
  const voiceID = req.body.voice_id;  // The ID of the voice you want to get
  const textInput = req.body.text;  // The text you wish to convert to speech
  const reverseVoices = {
    "6wLJ4Wm2OxvAvetEUBCS": "Alex",
    "WA9uLg4JEEGnvosWUUIc": "Jez",
    "TX3LPaxmHKxFdv7VOQHJ": "Liam",
    "gGqsateSZjogPUDNb6hx": "Myra",
    "cBijDV6IOSWp9c8dA7Xn": "Zoe"
};


  try {
    const audioStream = await voice.textToSpeechStream(apiKey, voiceID, textInput + reverseVoices[voiceID] + ".");
    res.setHeader('Content-Type', 'audio/mp3');
    audioStream.pipe(res);  // Send audio stream to client-side
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};

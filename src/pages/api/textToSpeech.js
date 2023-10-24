const voice = require("elevenlabs-node");

function formatMessage(template, ...values) {
  const segments = template.split('{}');
  let result = segments[0];

  for (let i = 1; i < segments.length; i++) {
    result += values[i - 1] + segments[i];
  }

  return result;
}

export default async (req, res) => {
  const apiKey = process.env.ELEVEN_LABS_API_KEY;
  const voiceID = req.body.voice_id;
  const textInput = req.body.text;
  const reverseVoices = {
    "6wLJ4Wm2OxvAvetEUBCS": "Alex",
    "WA9uLg4JEEGnvosWUUIc": "Jez",
    "TX3LPaxmHKxFdv7VOQHJ": "Liam",
    "gGqsateSZjogPUDNb6hx": "Myra",
    "cBijDV6IOSWp9c8dA7Xn": "Zoe"
  };


  try {
    const audioStream = await voice.textToSpeechStream(apiKey, voiceID, formatMessage(textInput, reverseVoices[voiceID]));
    res.setHeader('Content-Type', 'audio/mp3');
    audioStream.pipe(res);  // Send audio stream to client-side
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};

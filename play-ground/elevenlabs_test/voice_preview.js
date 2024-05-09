const voice = require("elevenlabs-node");
const fs = require("fs-extra");

const apiKey = "e3180d3a0798ea440c66b984e1ab0ef8"; // Your API key from Elevenlabs
const voiceID = "pNInz6obpgDQGcFmaJgB"; // The ID of the voice you want to get
const fileName = "audio.mp3"; // The name of your audio file
const textInput = "mozzy is cool"; // The text you wish to convert to speech

voice.textToSpeechStream(apiKey, voiceID, textInput).then((res) => {
  res.pipe(fs.createWriteStream(fileName));
});
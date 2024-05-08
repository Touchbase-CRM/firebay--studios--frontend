const voice = require("elevenlabs-node");
const fs = require("fs-extra");
const secrets = require('./secrets.json');
const apiKey = secrets.ELEVENLABS_API_KEY;


const voiceID = "pNInz6obpgDQGcFmaJgB"; // The ID of the voice you want to get
const fileName = "play_ground/elevenlabs_test/audio.mp3"; // The name of your audio file
const textInput = "You have failed this city"; // The text you wish to convert to speech

voice.textToSpeech(apiKey, voiceID, fileName, textInput).then((res) => {
  console.log(res);
});
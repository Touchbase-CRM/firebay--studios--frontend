const fs = require("fs-extra");
const ffmpeg = require("fluent-ffmpeg");
const voice = require("elevenlabs-node");
const secrets = require('./secrets.json');

const apiKey = secrets.ELEVENLABS_API_KEY;
const voiceID = "pNInz6obpgDQGcFmaJgB";
const speechFileName = "play_ground/elevenlabs_test/audio.mp3";
const textInput = "You have failed this city";
const backgroundMusicFileName = "data/ezio_fam_earth.mp3";
const outputFileName = "play_ground/elevenlabs_test/output.mp3";

async function generateSpeech() {
  try {
    const res = await voice.textToSpeech(apiKey, voiceID, speechFileName, textInput);
    console.log(res);
    return res;
  } catch (err) {
    console.error("Error generating speech: ", err);
  }
}

function mixAudio(speechFileName, backgroundMusicFileName, outputFileName) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(speechFileName)
      .input(backgroundMusicFileName)
      .on('end', () => {
        console.log('Audio files have been merged!');
        resolve();
      })
      .on('error', (err) => {
        console.error('Error:', err);
        reject(err);
      })
      .mergeToFile(outputFileName);
  });
}

(async () => {
  await generateSpeech();
  await mixAudio(speechFileName, backgroundMusicFileName, outputFileName);
})();

// Related path: src/pages/dashboard/utils/update-state.js
import useUserInputsStore from "@/store/user-inputs";
import { Section } from "@/data-structures/section";
import { fetchResourceFromS3 } from "@/utils/fetch-audio/fetch-resource-from-s3";

const {
  setOgScriptWordsArray,
  setOriginalScriptString,
  setTransformedWords,
  setVoiceId,
  setVoiceName,
  setVoicePreviewFilename,
  setAdLength,
  setChosenMusic,
  setMusicVol,
  setPreviewFileName,
  setBackgroundMusicFilename,
  setGeneratedVoiceUrl,
  setModelId,
  setAdGenerationMethod,
  setSpotId,
  setNumSectionsIdentified,
  setSectionsArray,
  setSectionHistoryArray,
  setStitchedAudioPyroHistoryItemId,
  setHistoryItemId,
  setV2aUploadedAudioUrl,
  setV2aQuickUploadedFile,
  setv2aQuickGeneratedAudioBlob,
  setV2aQuickAudioDuration,
} = useUserInputsStore.getState();

export function updateAdvancedS2AState(data) {
  return new Promise(async (resolve) => {
    // Synchronous state updates
    setOgScriptWordsArray(data.sharedStates.ogScriptWordsArray);
    setOriginalScriptString(data.sharedStates.originalScriptString);
    setTransformedWords(data.sharedStates.transformedWords);
    setVoiceId(data.sharedStates.voiceId);
    setVoiceName(data.sharedStates.voiceName);
    setVoicePreviewFilename(data.sharedStates.voicePreviewFilename);
    setAdLength(data.sharedStates.adLength);
    setChosenMusic(data.sharedStates.chosenMusic);
    setMusicVol(data.sharedStates.musicVol);
    setPreviewFileName(data.sharedStates.previewFileName);
    setBackgroundMusicFilename(data.sharedStates.backgroundMusicFilename);
    setGeneratedVoiceUrl(data.sharedStates.generatedVoiceUrl);
    setModelId(data.sharedStates.modelId);
    setAdGenerationMethod(data.sharedStates.adGenerationMethod);
    setSpotId(data.sharedStates.spotId);
    setNumSectionsIdentified(data.featureSpecificStates.numSectionsIdentified);
    setStitchedAudioPyroHistoryItemId(
      data.featureSpecificStates.stitchedAudioPyroHistoryItemId
    );

    // Asynchronous state updates
    try {
      const tmparr = await deserializeSectionsArray(
        data.featureSpecificStates.sectionsArray
      );
      setSectionsArray(tmparr);
      const tmpHistoryArray = await deserializeSectionHistoryArray(
        data.featureSpecificStates.sectionHistoryArray
      );
      setSectionHistoryArray(tmpHistoryArray);
      resolve(); // Resolve the promise after all async updates are done
    } catch (error) {
      console.error("Error updating state:", error);
      resolve(); // Resolve the promise also on error to not hang the promise
    }
  });
}

export function updateQuickS2AState(data) {
  return new Promise((resolve) => {
    // Synchronous state updates
    setOgScriptWordsArray(data.sharedStates.ogScriptWordsArray);
    setOriginalScriptString(data.sharedStates.originalScriptString);
    setTransformedWords(data.sharedStates.transformedWords);
    setVoiceId(data.sharedStates.voiceId);
    setVoiceName(data.sharedStates.voiceName);
    setVoicePreviewFilename(data.sharedStates.voicePreviewFilename);
    setAdLength(data.sharedStates.adLength);
    setChosenMusic(data.sharedStates.chosenMusic);
    setMusicVol(data.sharedStates.musicVol);
    setPreviewFileName(data.sharedStates.previewFileName);
    setBackgroundMusicFilename(data.sharedStates.backgroundMusicFilename);
    setGeneratedVoiceUrl(data.sharedStates.generatedVoiceUrl);
    setModelId(data.sharedStates.modelId);
    setAdGenerationMethod(data.sharedStates.adGenerationMethod);
    setSpotId(data.sharedStates.spotId);
    setHistoryItemId(data.featureSpecificStates.historyItemId);

    // Resolve promise after all updates
    resolve();
  });
}

export function updateQuickV2AState(data) {
  return new Promise(async (resolve) => {
    // Synchronous state updates
    setOgScriptWordsArray(data.sharedStates.ogScriptWordsArray);
    setOriginalScriptString(data.sharedStates.originalScriptString);
    setTransformedWords(data.sharedStates.transformedWords);
    setVoiceId(data.sharedStates.voiceId);
    setVoiceName(data.sharedStates.voiceName);
    setVoicePreviewFilename(data.sharedStates.voicePreviewFilename);
    setAdLength(data.sharedStates.adLength);
    setChosenMusic(data.sharedStates.chosenMusic);
    setMusicVol(data.sharedStates.musicVol);
    setPreviewFileName(data.sharedStates.previewFileName);
    setBackgroundMusicFilename(data.sharedStates.backgroundMusicFilename);
    setGeneratedVoiceUrl(data.sharedStates.generatedVoiceUrl);
    setModelId(data.sharedStates.modelId);
    setAdGenerationMethod(data.sharedStates.adGenerationMethod);
    setSpotId(data.sharedStates.spotId);
    setHistoryItemId(data.featureSpecificStates.historyItemId);

    // Asynchronous state updates:
    setV2aUploadedAudioUrl(data.featureSpecificStates.v2aUploadedAudioUrl);
    setV2aQuickUploadedFile(data.featureSpecificStates.v2aQuickUploadedFile);
    setV2aQuickAudioDuration(data.featureSpecificStates.v2aQuickAudioDuration);
    const tmpV2aUploadedAudioUrl = await fetchUploadedAudio(
      data.featureSpecificStates.v2aQuickUploadedFile.name
    );
    setV2aUploadedAudioUrl(tmpV2aUploadedAudioUrl);
    const tmpV2aQuickGeneratedAudioBlob = await createBlobFromUrl(
      tmpV2aUploadedAudioUrl
    );
    setv2aQuickGeneratedAudioBlob(tmpV2aQuickGeneratedAudioBlob);

    // Resolve promise after all updates
    resolve();
  });
}

async function deserializeSectionsArray(serializedSections) {
  const sections = await Promise.all(
    serializedSections.map(async (serializedSection) => {
      const section = Section.deserialize(serializedSection);
      await section.updateAudioUrl(0, 3); // Assuming you pass 0 for estimatedProcessingTime and 3 for maxRetries
      return section;
    })
  );
  return sections;
}

async function deserializeSectionHistoryArray(sectionHistoryArray) {
  const updatedSectionHistoryArray = await Promise.all(
    sectionHistoryArray.map(async (section) => {
      const transformedSection = new Map();
      for (const key in section) {
        const deserializedSection = Section.deserialize(section[key]);
        await deserializedSection.updateAudioUrl(0, 3); // Using default values for demonstration
        transformedSection.set(key, deserializedSection);
      }
      return transformedSection;
    })
  );
  return updatedSectionHistoryArray;
}

function createBlobFromUrl(url) {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Network response was not ok.");
      }
      const blob = await response.blob(); // Converts the response body into a Blob
      resolve(blob);
    } catch (error) {
      console.error("Error fetching the audio file:", error);
      resolve(null);
    }
  });
}

const fetchUploadedAudio = async (fileName) => {
  const response = await fetchResourceFromS3(
    "workingdir--storage",
    `save--files/${fileName}`,
    0
  );
  return response;
};

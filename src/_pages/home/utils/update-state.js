import useUserInputsStore from "@/store/user-inputs";
import { Section } from "@/data-structures/section";

const {
  setOgScriptWordsArray,
  setOriginalScriptString,
  setTransformedWords,
  setVoiceId,
  setVoiceName,
  setVoicePreviewFilename,
  setAdLength,
  setGeneratedVoiceUrl,
  setModelId,
  setAdGenerationMethod,
  setSpotId,
  setNumSectionsIdentified,
  setSectionsArray,
  setSectionHistoryArray,
  setStitchedAudioPyroHistoryItemId,
} = useUserInputsStore.getState();

export function updateAdvancedS2AState(data) {
  return new Promise(async (resolve) => {
    const shared = data.sharedStates || {};
    const featureSpecific = data.featureSpecificStates || {};

    setOgScriptWordsArray(shared.ogScriptWordsArray ?? []);
    setOriginalScriptString(shared.originalScriptString ?? "");
    setTransformedWords(shared.transformedWords ?? {});
    if (shared.voiceId !== undefined) setVoiceId(shared.voiceId);
    if (shared.voiceName !== undefined) setVoiceName(shared.voiceName);
    if (shared.voicePreviewFilename !== undefined) setVoicePreviewFilename(shared.voicePreviewFilename);
    if (shared.adLength !== undefined) setAdLength(shared.adLength);
    if (shared.generatedVoiceUrl !== undefined) setGeneratedVoiceUrl(shared.generatedVoiceUrl);
    if (shared.modelId !== undefined) setModelId(shared.modelId);
    if (shared.adGenerationMethod !== undefined) setAdGenerationMethod(shared.adGenerationMethod);
    if (shared.spotId !== undefined) setSpotId(shared.spotId);
    if (featureSpecific.numSectionsIdentified !== undefined) {
      setNumSectionsIdentified(featureSpecific.numSectionsIdentified);
    }
    if (featureSpecific.stitchedAudioPyroHistoryItemId !== undefined) {
      setStitchedAudioPyroHistoryItemId(featureSpecific.stitchedAudioPyroHistoryItemId);
    }

    try {
      const tmparr = await deserializeSectionsArray(featureSpecific.sectionsArray ?? []);
      setSectionsArray(tmparr);
      const tmpHistoryArray = await deserializeSectionHistoryArray(
        featureSpecific.sectionHistoryArray ?? []
      );
      setSectionHistoryArray(tmpHistoryArray);
      resolve();
    } catch (error) {
      console.error("Error updating state:", error);
      resolve();
    }
  });
}

async function deserializeSectionsArray(serializedSections) {
  return Promise.all(
    serializedSections.map(async (serialized) => {
      const section = Section.deserialize(serialized);
      await section.updateAudioUrl(0, 3);
      return section;
    })
  );
}

async function deserializeSectionHistoryArray(sectionHistoryArray) {
  return Promise.all(
    sectionHistoryArray.map(async (sectionMap) => {
      const transformed = new Map();
      for (const key in sectionMap) {
        const deserialized = Section.deserialize(sectionMap[key]);
        await deserialized.updateAudioUrl(0, 3);
        transformed.set(key, deserialized);
      }
      return transformed;
    })
  );
}

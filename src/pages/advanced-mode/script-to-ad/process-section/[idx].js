import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { usePostHog } from "posthog-js/react";
import Swal from "sweetalert2";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  query,
  collection,
  where,
} from "firebase/firestore";
import { getAuth } from "@/firebase";
import app from "@/firebase";

import { NavBar } from "@/components/foundation-components/nav-bar";
import SimpleAudioPlayer from "@/components/simple-audio-player";
import RenameModal from "@/components/rename-modal";

import { fetchAudioFromPyroBackendDistribution } from "@/utils/fetch-audio/fetch-from-distribution";
import { updateExistingSpotInDb } from "@/utils/db-read-write-ops/serialization-utils";
import { deserializeAndLoadModeData } from "@/utils/db-read-write-ops/deserialization-utils";
import { updateAdvancedS2AState } from "@/_pages/home/utils/update-state";
import { isUiPreviewMode } from "@/firebase";
import { PREVIEW_VOICES, PREVIEW_VOICE_CATEGORIES } from "@/lib/voicesPreview";
import { normalizeAge } from "@/lib/voiceAges";
import { normalizeAccent } from "@/lib/voiceAccents";

import useUserInputsStore from "@/store/user-inputs";
import withAuth from "@/hocs/with-auth";
import { Stack } from "@/data-structures/stack";

import { VoiceTab } from "@/_pages/advanced-mode/script-to-ad/process-section/components/inspector/voice-tab";
import { EmphasisTab } from "@/_pages/advanced-mode/script-to-ad/process-section/components/inspector/emphasis-tab";
import { HistoryTab } from "@/_pages/advanced-mode/script-to-ad/process-section/components/inspector/history-tab";

import { PageShell } from "@/components/ui/page-shell";
import { Stepper } from "@/components/ui/stepper";
import { Inspector } from "@/components/ui/inspector";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const STEPS = [
  { label: "Script" },
  { label: "Sections" },
  { label: "Stitch & export" },
];
const RESTRICTED_VOICES = ["Evan (Cloned)"];
const CHARACTERS_PER_SEC = 15.2;
const ADDITIONAL_WAIT_TIME_MS = 6000;
const SEC_TO_MS = 1000;
const PROCESSING_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:8000"
    : "https://vgz580uujk.execute-api.us-east-2.amazonaws.com";
const VOICE_PREVIEW_BASE = "https://static--files--storage.s3.us-east-2.amazonaws.com/voice--previews/";

// Groups the listed voice names by the admin-managed category order. Voices
// can appear in several groups; anything uncategorized lands in "Other voices".
// With no categories at all this degrades to one unlabeled flat group.
// What the voice picker needs per voice: grouping, description, and the
// gender / age / accent (stored as `nationality`) its filters work on.
const voiceMetaOf = (v) => ({
  categories: v.categories || [],
  description: v.description || "",
  gender: (v.voice_preview_filename || "").split("/")[0],
  age: normalizeAge(v.age),
  nationality: normalizeAccent(v.nationality),
  previewUrl: v.voice_preview_filename ? VOICE_PREVIEW_BASE + v.voice_preview_filename : "",
});

const groupVoices = (names, categories, meta) => {
  const groups = categories
    .map((label) => ({
      label,
      voices: names.filter((n) => meta[n]?.categories?.includes(label)),
    }))
    .filter((g) => g.voices.length > 0);
  if (groups.length === 0) return [{ label: null, voices: names }];
  const grouped = new Set(groups.flatMap((g) => g.voices));
  const other = names.filter((n) => !grouped.has(n));
  if (other.length > 0) groups.push({ label: "Other voices", voices: other });
  return groups;
};

const legacySpeechRate = (legacy) => {
  const map = { Normal: 0, "1.25x": 25, "1.5x": 50, "1.75x": 75, "2x": 100 };
  if (Object.prototype.hasOwnProperty.call(map, legacy)) return map[legacy];
  const n = Number(legacy);
  return !isNaN(n) && n >= -50 && n <= 100 ? n : 0;
};

const getAudioDuration = (url) =>
  new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.addEventListener("loadedmetadata", () => resolve(audio.duration));
    audio.addEventListener("error", reject);
  });

function ProcessSection() {
  const router = useRouter();
  const posthog = usePostHog();
  const auth = getAuth();

  const {
    spotId,
    spotName,
    setSpotName,
    sectionsArray,
    setSectionsArray,
    sectionHistoryArray,
    setSectionHistoryArray,
    adLength,
    numSectionsIdentified,
    s2aAdvancedFreeStyleStatus,
    setS2aAdvancedFreeStyleStatus,
    reset: resetUserInputsStore,
  } = useUserInputsStore();

  const { idx } = router.query;
  const initialSectionIndex = parseInt(idx, 10) || 0;

  const [currentSectionIndex, setCurrentSectionIndex] = useState(initialSectionIndex);
  const [voiceOptions, setVoiceOptions] = useState([]);
  const [voiceCategories, setVoiceCategories] = useState([]);
  const [voiceMeta, setVoiceMeta] = useState({});
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [localCurrentSectionObj, setLocalCurrentSectionObj] = useState(
    () => sectionsArray?.[initialSectionIndex]?.clone() || null
  );
  const [localSectionsArray, setLocalSectionsArray] = useState(sectionsArray);
  const [localSectionHistoryObj, setLocalSectionHistoryObj] = useState(
    sectionHistoryArray[initialSectionIndex] || null
  );
  const [localStack, setLocalStack] = useState(() => new Stack());
  const syncStackWithGlobal = useUserInputsStore((s) => s.setNavigationStack);

  const [activeTab, setActiveTab] = useState("voice");
  // Tracks which History take the user is currently auditioning. Cleared on
  // Save/Generate/section change. If the user clicks Save while previewing
  // a non-live take, that take is promoted to the live take.
  const [previewingTake, setPreviewingTake] = useState(null);
  const [selectedWordIndex, setSelectedWordIndex] = useState(null);

  const [ogScriptWordsArray, setOgScriptWordsArray] = useState(() =>
    localCurrentSectionObj?.getOriginalContent() ? localCurrentSectionObj.getCurrentWords() : []
  );
  const [typedText, setTypedText] = useState(() => ogScriptWordsArray.join(" "));
  const [transformedWords, setTransformedWords] = useState(
    () => localCurrentSectionObj?.getCurrentTransformations() || {}
  );

  const previousSectionsTotalDuration = localSectionsArray
    .slice(0, localCurrentSectionObj?.getIndex() ?? 0)
    .reduce((sum, s) => sum + s.getSectionDurationSeconds(), 0);

  const [progressPct, setProgressPct] = useState(() =>
    Math.round(
      ((previousSectionsTotalDuration + (localCurrentSectionObj?.getSectionDurationSeconds() ?? 0)) /
        adLength) * 100
    )
  );
  const [secondsLeft, setSecondsLeft] = useState(
    () => adLength - (previousSectionsTotalDuration + (localCurrentSectionObj?.getSectionDurationSeconds() ?? 0))
  );

  const [generatedVoiceUrl, setGeneratedVoiceUrl] = useState("");
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [allowDownload, setAllowDownload] = useState(false);
  const [forceRenderKey, setForceRenderKey] = useState(0);
  // Set when a voice preview from the picker is loaded into the bottom player,
  // so the player shows that voice's name instead of the section's voice.
  const [voicePreview, setVoicePreview] = useState(null);

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newSpotName, setNewSpotName] = useState(spotName);

  const charLimit = localCurrentSectionObj?.getOriginalCharCount() || 0;
  const charCount = typedText.replace(/'/g, "").length;
  const overLimit = charCount > charLimit;
  const hasGeneratedTake = !!localCurrentSectionObj?.getHistoryItemId();

  const saveFeatureSpecificStates = {
    sectionsArray,
    sectionHistoryArray,
    numSectionsIdentified,
    s2aAdvancedFreeStyleStatus,
  };
  const saveSharedStates = { spotName, spotId, adLength };

  useEffect(() => {
    const currentIdx = parseInt(idx, 10);
    syncStackAfterNavigation();

    if (currentIdx === localCurrentSectionObj?.getIndex()) return;

    setCurrentSectionIndex(currentIdx);
    setLocalSectionHistoryObj(sectionHistoryArray[currentIdx] || null);
    setPreviewingTake(null);

    if (!isNaN(currentIdx) && sectionsArray?.length > currentIdx) {
      const next = sectionsArray[currentIdx];
      setLocalCurrentSectionObj(next);
      setLocalSectionsArray(sectionsArray);
      updateSectionDetails(next);
      setShowAudioPlayer(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, sectionsArray?.length]);

  // Recover from a cold load (refresh, deep-link) where the in-memory store
  // is empty. If we have a spotId we know which spot to refetch; otherwise
  // we have nothing to render and the user belongs back on /home.
  useEffect(() => {
    if (!router.isReady) return;
    if (sectionsArray?.length > 0) return;
    let cancelled = false;
    (async () => {
      if (!spotId) {
        router.replace("/home");
        return;
      }
      try {
        const data = await deserializeAndLoadModeData({ spotId });
        if (cancelled) return;
        await updateAdvancedS2AState(data);
      } catch (error) {
        console.error("Failed to recover spot data:", error);
        if (!cancelled) router.replace("/home");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, sectionsArray?.length, spotId]);

  useEffect(() => {
    if (localCurrentSectionObj) updateSectionDetails(localCurrentSectionObj);
  }, [localCurrentSectionObj?.getGeneratedVoiceUrl()]);

  // Auto-load the live take's audio when arriving on a section so the user
  // can immediately hit play (instead of having to re-generate).
  useEffect(() => {
    const id = localCurrentSectionObj?.getHistoryItemId();
    const cachedUrl = localCurrentSectionObj?.getGeneratedVoiceUrl();
    if (!id) return;
    // If we still have a working blob URL from this session, reuse it.
    if (cachedUrl && cachedUrl.startsWith("blob:")) {
      setGeneratedVoiceUrl(cachedUrl);
      setShowAudioPlayer(true);
      return;
    }
    // Otherwise re-fetch from S3 / ElevenLabs by historyItemId.
    (async () => {
      try {
        const url =
          id.substring(0, 4) === "pyro"
            ? await fetchAudioFromPyroBackendDistribution(id, 0)
            : null;
        if (!url) return;
        setGeneratedVoiceUrl(url);
        setShowAudioPlayer(true);
      } catch (error) {
        console.warn("Couldn't auto-load section audio:", error);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localCurrentSectionObj?.getHistoryItemId()]);

  useEffect(() => {
    if (isUiPreviewMode) {
      const meta = {};
      PREVIEW_VOICES.forEach((v) => {
        meta[v.pyro_name] = voiceMetaOf(v);
      });
      setVoiceOptions(PREVIEW_VOICES.map((v) => v.pyro_name));
      setVoiceCategories(PREVIEW_VOICE_CATEGORIES);
      setVoiceMeta(meta);
      return;
    }
    (async () => {
      const db = getFirestore(app);
      const voicesDocRef = doc(db, "fetch_data_to_frontend", "pyro_voices");
      try {
        const snap = await getDoc(voicesDocRef);
        if (snap.exists()) setVoiceOptions(snap.data().pyro_voice_choices);
      } catch (error) {
        console.error("Error fetching voice options:", error);
      }
      // Categories and descriptions are optional — if either read fails the
      // dropdown falls back to the flat list above.
      try {
        const [categoriesSnap, voiceDocsSnap] = await Promise.all([
          getDoc(doc(db, "fetch_data_to_frontend", "pyro_voice_categories")),
          getDocs(collection(db, "pyro_voices")),
        ]);
        const meta = {};
        voiceDocsSnap.docs.forEach((d) => {
          const v = d.data();
          meta[v.pyro_name] = voiceMetaOf(v);
        });
        setVoiceMeta(meta);
        setVoiceCategories(
          (categoriesSnap.exists() && categoriesSnap.data().categories) || []
        );
      } catch (error) {
        console.error("Error fetching voice categories:", error);
      }
    })();
  }, []);

  const syncStackAfterNavigation = () => {
    const globalStack = useUserInputsStore.getState().navigationStack;
    const newStack = new Stack();
    newStack.items = [...globalStack.items];
    setLocalStack(newStack);
  };

  const localPushData = (newData) => {
    localStack.push(newData);
    setLocalStack(localStack);
  };
  const localPopData = () => {
    const removed = localStack.pop();
    setLocalStack(localStack);
    return removed;
  };
  const syncLocalStackWithGlobal = () => syncStackWithGlobal(localStack);

  const updateSectionDetails = (section) => {
    const idx = section.getIndex();
    const words = section.getOriginalContent() ? section.getCurrentWords() : [];
    setOgScriptWordsArray(words);
    setTypedText(words.join(" "));
    setTransformedWords(section.getCurrentTransformations());
    const prevDuration = sectionsArray
      .slice(0, idx)
      .reduce((s, sec) => s + sec.getSectionDurationSeconds(), 0);
    const pct = Math.round(((prevDuration + section.getSectionDurationSeconds()) / adLength) * 100);
    setProgressPct(pct);
    setSecondsLeft(adLength - (prevDuration + section.getSectionDurationSeconds()));
    setGeneratedVoiceUrl(section.getGeneratedVoiceUrl());
  };

  const updateLocalSectionHistoryObj = (newKv) => {
    setLocalSectionHistoryObj((prev) => {
      const next = new Map(prev);
      Object.entries(newKv).forEach(([k, v]) => next.set(k, v));
      return next;
    });
  };

  const addCurrentSectionHistoryToArray = (index, newObj) => {
    const arr = useUserInputsStore.getState().sectionHistoryArray;
    return [...arr.slice(0, index), newObj, ...arr.slice(index + 1)];
  };
  const syncSectionHistoryArrayWithZustand = (index, newObj) => {
    setSectionHistoryArray(addCurrentSectionHistoryToArray(index, newObj));
  };

  const handleSaveState = () => {
    // If the user was auditioning a non-live take from History, promote it
    // to the live take before persisting.
    if (
      previewingTake &&
      previewingTake.key !== localCurrentSectionObj.getHistoryItemId()
    ) {
      const promoted = previewingTake.section.clone();
      setLocalCurrentSectionObj(promoted);
      localSectionsArray[currentSectionIndex] = promoted;
      setPreviewingTake(null);
    } else {
      localSectionsArray[currentSectionIndex] = localCurrentSectionObj;
    }
    setSectionsArray(localSectionsArray);
    saveFeatureSpecificStates.sectionsArray = localSectionsArray;
    syncSectionHistoryArrayWithZustand(currentSectionIndex, localSectionHistoryObj);
    saveFeatureSpecificStates.sectionHistoryArray = addCurrentSectionHistoryToArray(
      currentSectionIndex,
      localSectionHistoryObj
    );
    updateExistingSpotInDb({
      spotId,
      mode: "advanced-script-to-ad",
      modeSpecificStates: saveFeatureSpecificStates,
      sharedStates: saveSharedStates,
    });
  };

  const processScriptChange = (newScript) => {
    setTypedText(newScript);
    // Mirror the edit onto the section object + the global sectionsArray
    // immediately so navigating back to the script step sees fresh text
    // without needing an explicit Save click.
    if (localCurrentSectionObj) {
      localCurrentSectionObj.setCurrentContent(newScript);
      localCurrentSectionObj.setCurrentWords(newScript.split(" "));
      const idx = localCurrentSectionObj.getIndex();
      localSectionsArray[idx] = localCurrentSectionObj;
      setSectionsArray(localSectionsArray);
    }
    const newWords = newScript.split(" ");
    const newTransformed = {};
    newWords.forEach((word, i) => {
      if (ogScriptWordsArray[i] === word && transformedWords[i]) {
        newTransformed[i] = transformedWords[i];
      }
    });
    setOgScriptWordsArray(newWords);
    setTransformedWords(newTransformed);
  };

  const handleScriptChange = (e) => processScriptChange(e.target.value);

  const showAlert = (icon, title, text) => Swal.fire({ icon, title, text });

  const validateScript = (script, onSuccess) => {
    const cleaned = script.replace(/'/g, "");
    if (cleaned.length < 1) {
      showAlert("error", "Script is empty", "Add some text first.");
      return false;
    }
    onSuccess();
    return true;
  };

  const fetchVoiceMetaData = async (voiceName) => {
    if (isUiPreviewMode) {
      const d = PREVIEW_VOICES.find((v) => v.pyro_name === voiceName);
      if (!d) return {};
      return {
        newVoiceId: d.elevenlabs_id,
        newVoicePreviewFilename: d.voice_preview_filename,
        newVoiceModelId: d.model_id,
        newVoiceIntonationConsistency: d.stability * 100,
      };
    }
    const db = getFirestore(app);
    const q = query(collection(db, "pyro_voices"), where("pyro_name", "==", voiceName));
    try {
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0].data();
        // Default stability to 0.5 (matches ElevenLabs UI default) when the
        // voice doc is missing the field — otherwise NaN flows downstream
        // and the backend crashes on float(None).
        const stability = typeof d.stability === "number" ? d.stability : 0.5;
        return {
          newVoiceId: d.elevenlabs_id,
          newVoicePreviewFilename: d.voice_preview_filename,
          newVoiceModelId: d.model_id || "eleven_multilingual_v2",
          newVoiceIntonationConsistency: stability * 100,
        };
      }
    } catch (error) {
      console.error("Error fetching voice metadata:", error);
    }
    return {};
  };

  const handleVoiceChange = async (selectedVoiceName) => {
    const m = await fetchVoiceMetaData(selectedVoiceName);
    if (m.newVoiceId && m.newVoicePreviewFilename && m.newVoiceModelId && m.newVoiceIntonationConsistency != null) {
      localCurrentSectionObj.setModelId(m.newVoiceModelId);
      localCurrentSectionObj.setVoiceId(m.newVoiceId);
      localCurrentSectionObj.setVoiceName(selectedVoiceName);
      localCurrentSectionObj.setVoicePreviewFilename(m.newVoicePreviewFilename);
      localCurrentSectionObj.setVoiceIntonationConsistency(m.newVoiceIntonationConsistency);
      setLocalCurrentSectionObj(localCurrentSectionObj.clone());
      setGeneratedVoiceUrl(VOICE_PREVIEW_BASE + localCurrentSectionObj.getVoicePreviewFilename());
    }
  };

  const handleVoicePreview = (name, url) => {
    setVoicePreview({ name, url });
    setAllowDownload(false);
    setGeneratedVoiceUrl(url);
    setShowAudioPlayer(true);
    setForceRenderKey(Math.random());
  };

  const handleFreeStyleChange = (e) => {
    setS2aAdvancedFreeStyleStatus(e.target.checked);
    if (e.target.checked) toast.warn("Your spot might go over the intended length");
  };

  const handleIntonationChange = (value) => {
    localCurrentSectionObj.setVoiceIntonationConsistency(value);
    setLocalCurrentSectionObj(localCurrentSectionObj.clone());
  };

  const handleSpeechRate = (value) => {
    localCurrentSectionObj.setSpeechRate(value);
    setLocalCurrentSectionObj(localCurrentSectionObj.clone());
  };

  const transformWord = (action) => {
    const word =
      transformedWords[selectedWordIndex] || ogScriptWordsArray[selectedWordIndex];
    const stripQuotes = (w) => (w?.startsWith("'") && w.endsWith("'") ? w.slice(1, -1) : w);
    const next = { ...transformedWords };
    switch (action) {
      case "emphasizeLevel1":
        next[selectedWordIndex] = stripQuotes(word).toUpperCase();
        break;
      case "emphasizeLevel2":
        next[selectedWordIndex] = `'${ogScriptWordsArray[selectedWordIndex]}'`;
        break;
      case "emphasizeLevel3":
        next[selectedWordIndex] = `'${ogScriptWordsArray[selectedWordIndex].toUpperCase()}'`;
        break;
      case "removeEmphasis":
        next[selectedWordIndex] = ogScriptWordsArray[selectedWordIndex];
        break;
      default:
        break;
    }
    setTransformedWords(next);
    setSelectedWordIndex(null);
  };

  const handleReadReplay = () => {
    setForceRenderKey(Math.random());
    setAllowDownload(true);
    setShowAudioPlayer(true);
    setGeneratedVoiceUrl(localCurrentSectionObj.getGeneratedVoiceUrl());
  };

  const playAudioUrl = (keyOrUrl, sectionMaybe) => {
    // Two call shapes for backwards-compat:
    //   playAudioUrl(url)                — legacy, just plays
    //   playAudioUrl(historyKey, section) — from History tab, also marks as previewing
    setForceRenderKey(Math.random());
    setAllowDownload(true);
    setShowAudioPlayer(true);
    if (sectionMaybe) {
      setGeneratedVoiceUrl(sectionMaybe.getGeneratedVoiceUrl());
      setPreviewingTake({ key: keyOrUrl, section: sectionMaybe });
    } else {
      setGeneratedVoiceUrl(keyOrUrl);
    }
  };

  const changeCurrentSectionObj = (newObj) => {
    if (process.env.NODE_ENV !== "development") {
      posthog.capture("process-section-history-read-used", {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        sectionId: idx,
      });
    }
    setLocalCurrentSectionObj(newObj.clone());
  };

  const handleNotesSave = () => setLocalCurrentSectionObj(localCurrentSectionObj);

  const updateVoiceForAllSections = (currentIndex) => {
    localSectionsArray.forEach((section, i) => {
      if (i > currentIndex && localSectionsArray[currentIndex + 1]?.getHistoryItemId() !== null) {
        return;
      }
      if (i >= currentIndex) {
        section.setVoiceId(localCurrentSectionObj.getVoiceId());
        section.setVoiceName(localCurrentSectionObj.getVoiceName());
        section.setVoicePreviewFilename(localCurrentSectionObj.getVoicePreviewFilename());
        section.setModelId(localCurrentSectionObj.getModelId());
        section.setVoiceIntonationConsistency(localCurrentSectionObj.getVoiceIntonationConsistency());
        section.setDragonBreathEnhancement(localCurrentSectionObj.getDragonBreathEnhancement());
        section.setSpeechRate(localCurrentSectionObj.getSpeechRate());
      }
    });
  };

  const getFinalScript = () =>
    ogScriptWordsArray.map((w, i) => transformedWords[i] || w).join(" ");

  async function generateVoiceWithCustomPreprocess(
    script,
    voiceId,
    voiceIntonationConsistency,
    modelId,
    userId,
    dragonsBreathMode,
    talkSpeed,
    legalDisclaimer
  ) {
    if (process.env.NODE_ENV !== "development") {
      posthog.capture("process-section-custom-preprocess-used", {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        dragonsBreathMode,
        speechRate: talkSpeed,
        voiceId: localCurrentSectionObj.getVoiceId(),
      });
    }
    const voiceGender = localCurrentSectionObj.getVoicePreviewFilename().split("/")[0];
    // Only include `emotion` when dragon's breath is on — otherwise the backend
    // moodifies the script even for vanilla generations.
    const payload = {
      script,
      voice: voiceId,
      voice_intonation_consistency: voiceIntonationConsistency,
      model_id: modelId,
      voice_gender: voiceGender,
      user_id: userId,
      dragons_breath_mode: dragonsBreathMode,
      speech_rate: talkSpeed,
      legal_disclaimer: legalDisclaimer,
    };
    if (dragonsBreathMode) payload.emotion = "enthusiastically";

    const response = await fetch(`${PROCESSING_URL}/preprocess-voiceover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`HTTP ${response.status}${text ? `: ${text.slice(0, 200)}` : ""}`);
    }
    const data = await response.json();
    if (!data?.pyro_history_item_id) {
      throw new Error(data?.error || "pyro_history_item_id not found in response");
    }
    const pyroHistoryItemId = data.pyro_history_item_id;
    // Backend uploads to S3 before returning, so no pre-fetch wait is needed.
    const audioUrl = await fetchAudioFromPyroBackendDistribution(pyroHistoryItemId, 0);
    return { audioUrl, localHistoryItemId: pyroHistoryItemId };
  }

  async function handleGenerateVoice() {
    if (!validateScript(typedText, () => {})) return;
    setIsGeneratingVoice(true);
    setPreviewingTake(null);
    try {
      const finalScript = getFinalScript();

      // Always route through the backend so audio lands in our S3 with a
      // pyro_* id. ElevenLabs' history isn't reliable to fetch from at stitch
      // time (lower tiers don't persist history), which caused
      // "Section N's audio couldn't be loaded" right after a fresh generate.
      const result = await generateVoiceWithCustomPreprocess(
        finalScript,
        localCurrentSectionObj.getVoiceId(),
        localCurrentSectionObj.getVoiceIntonationConsistency(),
        localCurrentSectionObj.getModelId(),
        auth.currentUser.uid,
        false, // Dragon's breath was removed from the UI; never send it.
        legacySpeechRate(localCurrentSectionObj.getSpeechRate()),
        true
      );

      const { audioUrl, localHistoryItemId } = result;
      setAllowDownload(true);
      setShowAudioPlayer(true);
      setGeneratedVoiceUrl(audioUrl);

      const newDuration = await getAudioDuration(audioUrl);
      setProgressPct(Math.round(((previousSectionsTotalDuration + newDuration) / adLength) * 100));
      setSecondsLeft(adLength - previousSectionsTotalDuration - newDuration);

      localCurrentSectionObj.setCurrentTransformations(transformedWords);
      localCurrentSectionObj.setCurrentWords(ogScriptWordsArray);
      localCurrentSectionObj.setSectionDurationSeconds(newDuration);
      localCurrentSectionObj.setHistoryItemId(localHistoryItemId);
      localCurrentSectionObj.setCurrentContent(finalScript);
      localCurrentSectionObj.setGeneratedVoiceUrl(audioUrl);
      setLocalCurrentSectionObj(localCurrentSectionObj.clone());
      updateLocalSectionHistoryObj({ [localCurrentSectionObj.getHistoryItemId()]: localCurrentSectionObj });
    } catch (error) {
      console.error("Error generating voice:", error);
      Swal.fire({
        icon: "error",
        title: "Couldn't generate the voice",
        text:
          error?.message ||
          "Something went wrong while generating. Try again in a moment.",
      });
    } finally {
      setIsGeneratingVoice(false);
    }
  }

  const handleGoBack = () => {
    const idx = localCurrentSectionObj.getIndex();
    updateLocalSectionHistoryObj({ [localCurrentSectionObj.getHistoryItemId()]: localCurrentSectionObj });
    syncSectionHistoryArrayWithZustand(currentSectionIndex, localSectionHistoryObj);
    localSectionsArray[idx] = localCurrentSectionObj;
    setSectionsArray(localSectionsArray);
    localPushData(`/advanced-mode/script-to-ad/process-section/${idx}`);
    syncLocalStackWithGlobal();
    handleSaveState();
    if (idx > 0) {
      router.push(
        "/advanced-mode/script-to-ad/process-section/[idx]",
        `/advanced-mode/script-to-ad/process-section/${idx - 1}`
      );
    } else {
      router.push("/advanced-mode/script-to-ad/create-sections");
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!isUiPreviewMode && !localCurrentSectionObj.getHistoryItemId()) {
      showAlert("info", "Generate first", "Generate this section's voice before continuing.");
      return;
    }
    syncSectionHistoryArrayWithZustand(currentSectionIndex, localSectionHistoryObj);
    localCurrentSectionObj.setCurrentTransformations(transformedWords);
    localCurrentSectionObj.setCurrentWords(ogScriptWordsArray);
    const idx = localCurrentSectionObj.getIndex();

    if (localStack.size() > 0) {
      localSectionsArray[idx] = localCurrentSectionObj;
      setLocalSectionsArray(localSectionsArray);
      const lastInUrl = localPopData();
      syncLocalStackWithGlobal();
      handleSaveState();
      router.push(lastInUrl);
    } else {
      localSectionsArray[idx] = localCurrentSectionObj;
      updateVoiceForAllSections(idx);
      setSectionsArray(localSectionsArray);
      handleSaveState();
      if (currentSectionIndex >= localSectionsArray.length - 1) {
        router.push("/advanced-mode/script-to-ad/stitch-sections");
      } else {
        router.push(
          "/advanced-mode/script-to-ad/process-section/[idx]",
          `/advanced-mode/script-to-ad/process-section/${currentSectionIndex + 1}`
        );
      }
    }
  };

  const handleStepClick = (stepIdx) => {
    if (stepIdx === 0) router.push("/advanced-mode/script-to-ad/create-sections");
  };

  const handleLogout = () => {
    resetUserInputsStore();
    localStorage.removeItem("user");
    auth
      .signOut()
      .then(() => router.push("/login"))
      .catch((error) => console.error("Logout Error:", error));
  };

  if (!localCurrentSectionObj) {
    return (
      <PageShell>
        <NavBar links={[]} logoutHandler={handleLogout} />
        <div style={{ padding: "var(--space-9)", textAlign: "center", color: "var(--text-muted)" }}>
          Loading section…
        </div>
      </PageShell>
    );
  }

  const filteredVoices = voiceOptions.filter((voice) => {
    const isRestricted = RESTRICTED_VOICES.includes(voice);
    const isFirebay = auth.currentUser?.email?.split("@")[1] === "firebaystudios.com";
    return !isRestricted || (isRestricted && isFirebay);
  });

  const voiceGroups = groupVoices(filteredVoices, voiceCategories, voiceMeta);
  const currentVoiceName = localCurrentSectionObj.getVoiceName();

  const tabs = [
    {
      value: "voice",
      label: "Voice",
      content: (
        <VoiceTab
          voiceGroups={voiceGroups}
          voiceMeta={voiceMeta}
          voiceName={currentVoiceName}
          onVoiceChange={handleVoiceChange}
          onVoicePreview={handleVoicePreview}
          previewingVoice={
            showAudioPlayer && voicePreview?.url === generatedVoiceUrl ? voicePreview.name : null
          }
          intonation={localCurrentSectionObj.getVoiceIntonationConsistency()}
          onIntonationChange={handleIntonationChange}
          speechRate={legacySpeechRate(localCurrentSectionObj.getSpeechRate())}
          onSpeechRateChange={handleSpeechRate}
          emphasis={
            <EmphasisTab
              words={typedText.split(" ")}
              transformedWords={transformedWords}
              selectedWordIndex={selectedWordIndex}
              onWordSelect={(i) => setSelectedWordIndex(i)}
              onTransform={transformWord}
            />
          }
        />
      ),
    },
    {
      value: "history",
      label: "History",
      badge: localSectionHistoryObj ? localSectionHistoryObj.size : 0,
      content: (
        <HistoryTab
          historyMap={localSectionHistoryObj}
          currentHistoryItemId={localCurrentSectionObj.getHistoryItemId()}
          previewingKey={previewingTake?.key}
          onPlay={playAudioUrl}
          onRestore={changeCurrentSectionObj}
        />
      ),
    },
  ];

  const sectionLabel = `Section ${localCurrentSectionObj.getIndex() + 1} of ${numSectionsIdentified || localSectionsArray.length}`;

  return (
    <PageShell>
      <NavBar links={[]} logoutHandler={handleLogout} />
      <Stepper steps={STEPS} current={1} onStepClick={handleStepClick} />

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* LEFT: script editor */}
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "var(--space-6)",
            paddingBottom: showAudioPlayer ? 120 : "var(--space-6)",
            gap: "var(--space-4)",
            minWidth: 0,
            backgroundColor: "var(--surface-canvas)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--font-weight-semibold)", margin: 0, color: "var(--text-primary)" }}>
                  {spotName || "Untitled spot"}
                </h1>
                <button
                  type="button"
                  onClick={() => setShowRenameModal(true)}
                  aria-label="Rename"
                  style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}
                >
                  <i className="bi bi-pencil" style={{ fontSize: 14 }} />
                </button>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  fontSize: "var(--text-sm)",
                  color: "var(--text-secondary)",
                  marginTop: 4,
                }}
              >
                <span>{sectionLabel}</span>
                <Badge tone={progressPct > 100 ? "danger" : "neutral"}>
                  {Math.round(secondsLeft)}s left of {adLength}s
                </Badge>
              </div>
            </div>
          </div>

          {/* Progress strip */}
          <div
            style={{
              height: 6,
              backgroundColor: "var(--gray-200)",
              borderRadius: "var(--radius-full)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.min(progressPct, 100)}%`,
                height: "100%",
                backgroundColor: progressPct > 100 ? "var(--danger-500)" : "var(--accent-500)",
                transition: "width var(--duration-slow) var(--ease-out)",
              }}
            />
          </div>

          {/* Script editor */}
          <Textarea
            label="Section script"
            placeholder={`Up to ${charLimit} characters for this section.`}
            value={typedText}
            onChange={handleScriptChange}
            rows={10}
            counter={
              <span style={{ color: overLimit ? "var(--danger-500)" : "var(--text-muted)" }}>
                {charCount} / {charLimit}
              </span>
            }
            style={{ minHeight: 280 }}
          />

          {/* Full-script context */}
          {localSectionsArray.length > 1 && (
            <div
              style={{
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-3) var(--space-4)",
                backgroundColor: "var(--surface-inset)",
              }}
            >
              <div
                style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--font-weight-semibold)",
                  color: "var(--text-muted)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  marginBottom: "var(--space-2)",
                }}
              >
                Full script
              </div>
              <div
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                }}
              >
                {localSectionsArray.map((section, i) => {
                  const isCurrent = i === currentSectionIndex;
                  const text =
                    isCurrent ? typedText : section.getCurrentContent() || section.getOriginalContent();
                  return (
                    <span
                      key={i}
                      style={{
                        color: isCurrent ? "var(--text-primary)" : "var(--text-muted)",
                        backgroundColor: isCurrent ? "var(--accent-50)" : "transparent",
                        fontWeight: isCurrent ? "var(--font-weight-medium)" : "var(--font-weight-regular)",
                        padding: isCurrent ? "0 4px" : "0",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      {text}
                      {i < localSectionsArray.length - 1 && " "}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Audio player renders as a fixed bottom bar (see SimpleAudioPlayer). */}
          {showAudioPlayer && (
            <SimpleAudioPlayer
              audioSrc={generatedVoiceUrl}
              audioTitle={
                voicePreview?.url === generatedVoiceUrl
                  ? voicePreview.name
                  : localCurrentSectionObj.getVoiceName()
              }
              allowDownload={allowDownload}
              autoplay
              forceRender={forceRenderKey}
              setShowAudioPlayer={setShowAudioPlayer}
            />
          )}

          <div
            style={{
              marginTop: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--space-2)",
              flexWrap: "wrap",
              borderTop: "1px solid var(--border-subtle)",
              paddingTop: "var(--space-4)",
            }}
          >
            <Button variant="secondary" onClick={handleGoBack} leftIcon={<i className="bi bi-arrow-left" />}>
              Back
            </Button>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <Button
                variant="secondary"
                onClick={handleSaveState}
                feedback="Saved"
                title="Saves the current take as the live version. Past takes stay in the History tab so you can switch back at any time."
              >
                Save
              </Button>
              <Button
                variant="primary"
                onClick={handleGenerateVoice}
                loading={isGeneratingVoice}
                leftIcon={hasGeneratedTake ? <i className="bi bi-arrow-clockwise" /> : null}
              >
                {isGeneratingVoice ? "Generating…" : "Generate"}
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                rightIcon={<i className="bi bi-arrow-right" />}
              >
                {currentSectionIndex >= localSectionsArray.length - 1 ? "Stitch" : "Next"}
              </Button>
            </div>
          </div>

          <ToastContainer position="top-center" autoClose={4000} />
        </main>

        {/* RIGHT: inspector */}
        <Inspector
          tabs={tabs}
          value={activeTab}
          onChange={setActiveTab}
          style={{ alignSelf: "stretch" }}
        />
      </div>

      <RenameModal
        show={showRenameModal}
        onHide={() => setShowRenameModal(false)}
        newSpotName={newSpotName}
        setNewSpotName={setNewSpotName}
        spotId={spotId}
        setSpotName={setSpotName}
      />
    </PageShell>
  );
}

export default withAuth(ProcessSection);

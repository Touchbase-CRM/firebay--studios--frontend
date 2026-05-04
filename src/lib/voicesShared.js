import { S3Client } from "@aws-sdk/client-s3";

export const PREVIEWS_BUCKET = "static--files--storage";
export const PREVIEWS_PREFIX = "voice--previews";
export const PREVIEW_MAX_BYTES = 5 * 1024 * 1024;
export const ALLOWED_GENDERS = ["male", "female"];
export const DEFAULT_MODEL_ID = "eleven_multilingual_v2";

export function s3() {
  return new S3Client({
    region: "us-east-2",
    credentials: {
      accessKeyId: process.env.MIN_PYRO_USER_AWS_ACCESS_KEY,
      secretAccessKey: process.env.MIN_PYRO_USER_AWS_SECRET_KEY,
    },
  });
}

export function slugify(name) {
  return String(name)
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function previewKey(gender, slug) {
  return `${PREVIEWS_PREFIX}/${gender}/${slug}.mp3`;
}

export function previewFilename(gender, slug) {
  return `${gender}/${slug}.mp3`;
}

export function fail(res, status, error, field, hint) {
  return res.status(status).json({ error, field, hint });
}

export function validatePyroName(name) {
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return { error: "Display name is required.", field: "pyro_name" };
  }
  if (name.length > 80) {
    return {
      error: "Display name must be 80 characters or fewer.",
      field: "pyro_name",
      hint: `Got ${name.length} characters.`,
    };
  }
  return null;
}

export function validateElevenlabsId(id) {
  if (!id || typeof id !== "string") {
    return {
      error: "ElevenLabs voice ID is required.",
      field: "elevenlabs_id",
      hint:
        "Copy it from elevenlabs.io → Voices → click a voice → ID button.",
    };
  }
  if (!/^[A-Za-z0-9]{15,30}$/.test(id)) {
    return {
      error:
        "ElevenLabs voice ID looks wrong. Copy it from the ElevenLabs Voice Library — it's a ~20-character alphanumeric string.",
      field: "elevenlabs_id",
      hint: `Got '${id}'.`,
    };
  }
  return null;
}

export function validateGender(gender) {
  if (!ALLOWED_GENDERS.includes(gender)) {
    return {
      error:
        "Pick male or female — this controls the pronoun used in emotional script preprocessing.",
      field: "voice_gender",
    };
  }
  return null;
}

export function validateModelId(id) {
  if (id == null || id === "") return null;
  if (typeof id !== "string" || id.length > 60) {
    return {
      error: "Model ID must be a string of 60 characters or fewer.",
      field: "model_id",
    };
  }
  return null;
}

function looksLikeMp3(file) {
  if (!file) return false;
  const mime = (file.mimetype || "").toLowerCase();
  if (mime === "audio/mpeg" || mime === "audio/mp3") return true;
  const name = (file.originalFilename || "").toLowerCase();
  return name.endsWith(".mp3");
}

export function validatePreviewFile(file, { required }) {
  if (!file) {
    if (!required) return null;
    return {
      error:
        "Upload a preview MP3. This is the audio users hear when previewing the voice in Pyro's dropdown.",
      field: "preview",
    };
  }
  if (!looksLikeMp3(file)) {
    return {
      error: `Preview must be an MP3 file. Got '${
        file.mimetype || "unknown"
      }' (file: '${file.originalFilename || "unnamed"}'). Re-export from your audio editor as .mp3 and try again.`,
      field: "preview",
    };
  }
  if (typeof file.size === "number" && file.size > PREVIEW_MAX_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return {
      error: `Preview file is ${mb} MB; the limit is 5 MB. Trim to under 30 seconds or re-encode at 128 kbps (plenty for a preview).`,
      field: "preview",
    };
  }
  return null;
}

export function firstString(value) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function firstFile(files) {
  if (!files) return null;
  const f = files.preview || files.file;
  if (!f) return null;
  return Array.isArray(f) ? f[0] : f;
}

// Age buckets for voices, in display order. Stored values from before the
// switch to "Mature" (and the 25 legacy docs' "Mature"/"Middle Age") are
// normalized on read, so no data migration is needed.
export const VOICE_AGES = ["Young", "Middle age", "Mature"];

const AGE_ALIASES = {
  young: "Young",
  "middle age": "Middle age",
  "middle aged": "Middle age",
  mature: "Mature",
  older: "Mature",
  old: "Mature",
};

export function normalizeAge(age) {
  return AGE_ALIASES[String(age || "").trim().toLowerCase()] || "";
}

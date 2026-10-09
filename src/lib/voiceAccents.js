// Accents Pyro doesn't name directly. Per Ed, only non-political accents
// (British, Australian, etc.) are featured; anything else reads as "Other",
// both in the picker filter and the admin page, and the next admin save
// rewrites the stored value.
const OTHER = "Other";
const REMAPPED_ACCENTS = ["african"];

// A–Z, with "Other" always last.
export function compareAccents(a, b) {
  if (a === OTHER) return b === OTHER ? 0 : 1;
  if (b === OTHER) return -1;
  return a.localeCompare(b);
}

export function normalizeAccent(accent) {
  const value = String(accent || "").trim();
  return REMAPPED_ACCENTS.includes(value.toLowerCase()) ? OTHER : value;
}

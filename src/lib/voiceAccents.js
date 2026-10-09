// Accents Pyro doesn't feature. Per Ed, only non-political accents (British,
// Australian, etc.) are shown. Stored values in this list read as "no
// accent", so they drop out of the picker filter and the admin page, and the
// next admin save clears them from the voice doc.
const HIDDEN_ACCENTS = ["african"];

export function normalizeAccent(accent) {
  const value = String(accent || "").trim();
  return HIDDEN_ACCENTS.includes(value.toLowerCase()) ? "" : value;
}

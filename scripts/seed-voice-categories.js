/*
 * One-off seed: load the initial voice categories, descriptions, age and
 * nationality.
 *
 * Writes the ordered category list to `fetch_data_to_frontend/pyro_voice_categories`
 * and sets `categories` on each matching `pyro_voices/{id}` doc, plus
 * `description`, `age` and `nationality` wherever those are still empty.
 * Other voice fields are untouched. After this runs, everything is managed
 * from /admin/voices.
 *
 * Names match `pyro_name` case-insensitively, ignoring a trailing " (Cloned)".
 * The report lists names that matched nothing, listed voices left uncategorized,
 * and voices whose stored gender disagrees with the category.
 *
 * Idempotent — safe to re-run. Only writes when something changes.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
 *     node scripts/seed-voice-categories.js [--dry-run] [--project=<id>]
 */

const admin = require("firebase-admin");

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const projectArg = args.find((a) => a.startsWith("--project="));
const projectId = projectArg ? projectArg.split("=")[1] : process.env.GCLOUD_PROJECT;

const SPANISH = "Spanish accent. Great for Spanish language.";
const BRITISH = "British accent";

// [category, gender, voices]. A voice may be listed under several categories.
const SEED = [
  ["Male · Young", "male", ["Finn", "Charley", "Jackson", "Jamaal", "Jez"]],
  [
    "Male · Middle age",
    "male",
    [
      "Adam", "Andy (Cloned)", "Asher", "Benny", "Brad", "Brian", "Guy", "Hugh",
      "Jabari", "Jamison", "Julius", "Lincoln", "Mark", "Marvin", "Titan",
    ],
  ],
  [
    "Male · Mature",
    "male",
    ["Jim", "Craig", "Connor", "Darren", "David", "Hank", "Oil Man", "Sully"],
  ],
  [
    "Female · Young",
    "female",
    [
      "Allison", "Bella", "Hannah", "Honey", "Ivanna", "Kate", "Luna", "McKenna",
      "Piper", "Riley", "Tiffany", "Tori",
    ],
  ],
  [
    "Female · Middle age",
    "female",
    [
      "Emma", "Betty", "Brittany", "Gladys", "Hope", "Jessica",
      "Matilda", "Maya", "Meg", "Mia", "Scarlett", "Lilian",
    ],
  ],
  ["Female · Mature", "female", ["Carol", "J.J."]],
  ["Accents · Male", "male", ["Alejandro", "Diego", "Edward", "Archer", "Oliver"]],
  ["Accents · Female", "female", ["Camila", "Darcy", "Puja", "Meg"]],
];

const DESCRIPTIONS = {
  Alejandro: SPANISH,
  Diego: SPANISH,
  Camila: SPANISH,
  Edward: BRITISH,
  Archer: BRITISH,
  Darcy: BRITISH,
  Meg: BRITISH,
  Oliver: "Australian accent",
  Puja: "Indian accent",
};

// Every other voice gets a description keyed by its ElevenLabs voice ID, so
// it matches even when the Pyro display name differs from ElevenLabs'. Written
// from each voice's ElevenLabs labels (accent, age, tone, use case).
const DESCRIPTIONS_BY_ELEVENLABS_ID = {
  CwhRBWXzGAHq8TQ4Fs17: "Laid-back and resonant. Great for casual.",
  EXAVITQu4vr4xnSDxMaL: "Warm, confident, reassuring. Great for TV.",
  FGY2WhTYpPnrIDTdsKH5: "Sunny and quirky. Great for social media.",
  IKne3meq5aSn9XLyUdCD: "Australian accent. Confident and energetic.",
  JBFqnCBsd6RMkjVDRZzb: "British accent. Warm, captivating narrator.",
  N2lVS1w4EtoT3dr4eOWO: "Husky and gravelly. Great for characters.",
  SAz9YHcvj6GT2YYXdXww: "Relaxed and neutral. Great for narration.",
  SOYHLrjzK2X1ezoPC6cr: "Rough and fierce. Great for characters.",
  TX3LPaxmHKxFdv7VOQHJ: "Energetic and warm. Great for reels.",
  Xb7hH8MSUJpSbSDYk0k2: "British accent. Clear, engaging educator.",
  XrExE9yKIg1WjnnlVkGX: "Upbeat, professional alto. Very versatile.",
  bIHbv24MWmeRgasZH58o: "Relaxed and optimistic. Conversational.",
  cgSgspJ2msm6clMCkdW9: "Playful and bright. Great for trendy ads.",
  cjVigY5qzO86Huf0OWal: "Smooth, trustworthy tenor.",
  hpp4J3VqNfWAUOO0d1Us: "Warm, bright, professional narrator.",
  iP95p4xoKVk53GoZ742B: "Charming and down-to-earth. Very versatile.",
  nPczCjzI2devNBz1zQrb: "Deep and comforting. Great for ads.",
  onwK4e9ZLuTAKqWW03F9: "British accent. Steady news broadcaster.",
  pFZP5JQG7iQjIQuC4Bku: "British accent. Velvety news and narration.",
  pNInz6obpgDQGcFmaJgB: "Bright, brash tenor. Cuts through.",
  pqHfZKP75CvOlQylNhV4: "Wise and friendly. Great for ads.",
  BwsRV8gluuGcJrvENPbd: "Confident older voice. Great for narration.",
  fDte6eby6sYdcYcjHbl0: "Strong and booming. Great for storytelling.",
  oUuKdgAAYDJw2mjjO8jG: "Cloned voice of Feltman Agency's GM.",
  tMvyQtpCVQ0DkixuYm6J: "Warm and clear. Friendly authority.",
  L0Dsvb3SLTyegXwtm47J: "British accent. Calm and conversational.",
  Xb3zeLrTi6F4ziIcXdwk: "Soft, timid boy. Great for characters.",
  "2bk7ULW9HfwvcIbMWod0": "Breezy New Yorker. Great for social media.",
  lkVAP8k5tC0Wr1dYyQZH: "Kind and gentle. Great for inspiring reads.",
  "5u41aNhyCU6hXOcjPPv0": "Calm, cool grandma. Relatable and real.",
  "6wLJ4Wm2OxvAvetEUBCS": "Strong, expressive narrator.",
  aOcS60CY8CoaVaZfqqb5: "Deep Southern cowboy. Great for narration.",
  wBXNqKUATyqu0RtYt25i: "Rich and deep. Great radio announcer.",
  gPPH6SLdL8XSX6GNJ40G: "Friendly, relatable everyman.",
  rI34FMqFgY9kQxffNV58: "British accent. Classy and mature.",
  "6O8E1UOlJbvkhJDpV0aB": "Confident and motivational.",
  Rn9Yq7uum9irZ6RwppDN: "Confident early-20s. Great for recaps.",
  "8bRmOvh6tl1JtNu7uUdF": "British accent. Deep, smooth storyteller.",
  BNgbHR0DNeZixGQVzloa: "British accent. Deep storyteller.",
  iDEmt5MnqUotdwCIVplo: "Mexican Spanish accent. Calm narrator.",
  gbTn1bmCvNgk0QEAVyfM: "Mexican Spanish accent. Gentle narrator.",
  eScsMiMALXY1bEJFNH8o: "Confident older woman. Great news reader.",
  "34lPwSZ54D8fWbX1aHzk": "Upbeat TV and radio announcer.",
  vBKc2FfBKJfcZNyEt1n6: "Upbeat and conversational. Great for pods.",
  hHjbwzYZW17oh0p05AKv: "Mexican Spanish accent. Warm and clear.",
  Mac2FKpSgaGIsaNRXt8A: "Natural, warm, conversational.",
  Dslrhjl3ZpzrctukrQSN: "Casual and edgy. Great for pop culture.",
  iLiLWmBplDMUW2SuUEnM: "Mature and formal. Great for business.",
  "8n9Xb8GOqw6yNVOQ6ewr": "Confident and modern. Great for ads.",
  zGjIP4SZlMnY9m93k97r: "Clear and relatable. Great for podcasts.",
  "6F5Zhi321D3Oq7v1oNT4": "Deep movie-trailer voice. Great for ads.",
  tnSpp4vdxKPjI9w0GnoV: "Upbeat and clear. Great for social media.",
  Q4CesJn2rW0ITUs66gST: "Warm, wise storyteller.",
  SaqYcK3ZpDKBAImA8AdW: "Soft, warm, intimate. Great for social.",
  yM93hbw8Qtvdma2wCnJG: "Young, casual, and versatile.",
  "9oqLJH1XFK0K90OEebQ5": "Extremely deep country voice.",
  lxYfHSkYm1EzQzGhdbfc: "Calm, confident pro narrator.",
  cBijDV6IOSWp9c8dA7Xn: "Hyped and animated. Great for characters.",
  WA9uLg4JEEGnvosWUUIc: "Casual and confident. Everyday stories.",
  CVRACyqNcQefTlxMj9bt: "Raspy and conversational.",
  "5f49vYETqZvJYfUP28fO": "Warm, powerful, commanding narrator.",
  DTKMou8ccj1ZaWGBiotd: "Chill, stylish, conversational.",
  "7EzWGsX10sAS4c9m9cPf": "Natural, professional support agent.",
  ii0s2u4R3UFnxKL6DOrz: "Warm Californian. Relaxed and modern.",
  A9hvW90SK1w1iyI1xxf9: "Warm, calm, and reassuring.",
  xctasy8XvGp2cVO9HL9k: "Fun millennial. Great for commercials.",
  "6rOxfAnZpbM3VIEhFaeV": "Calm and soothing. Great for wellness.",
  yPh7KyOT84PcyPINBrfi: "Sassy valley girl. Great for shorts.",
  sQAyEY9ksexU3gWxo7gG: "British accent. Light and gentle.",
  H7iAQkUszVJadHiMHW1E: "American woman.",
  VlUmeC1Uzj3NnwiVR9K9: "Relaxed, confident, and authentic.",
  xHrx1s67XbIvR0zlXxsF: "Excited and conversational.",
  DduhIyyKkOosbP8VefhP: "Big, deep hard sell. Great for concerts.",
  sDh3eviBhiuHKi0MjTNq: "Mexican Spanish accent. Clean, corporate.",
  "13GEZWBtAkrNBdBPOAHw": "Featured in WSPA spots.",
  AiVXo6AkAsMPEX0qNgmP: "Youthful guy next door.",
  jA08rXmVrpvXnqEEEYwl: "Indian accent",
  DtsPFCrhbCbbJkwZsb3d: "Relaxed, fun BFF. Conversational.",
  nL7Nn9iAEdlXf7oChcj8: "Casual and versatile narrator.",
  wGcFBfKz5yUQqhqr0mVy: "Calm, grandmotherly storyteller.",
  cCYjmrGZaI86GUJ7F2Nn: "Deep and smooth. Great for documentaries.",
  kXsOSDWolD7e9l1Z0sbH: "Natural and conversational.",
  KLdNDyqBEJAF1RKESXvL: "Cloned voice of an award-winning actress.",
  zCgijgIKIMkFHnzXcCva: "Excited and youthful. Conversational.",
  RG7cEBfKE5GfK0ZP0uzl: "Pleasant and conversational.",
  "6aDn1KB0hjpdcocrUkmq": "Chill and natural. Great for support.",
  wAGzRVkxKEs8La0lmdrE: "Deep and mature.",
  KHJAv6FBeaIDV1IplidF: "Serious, mature storyteller.",
  dtSEyYGNJqjrtBArPCVZ: "Deep, bold, and powerful.",
  aGkVQvWUZi16EH8aZJvT: "Australian accent. Pro podcast narrator.",
  HKFOb9iktHA85uKXydRT: "Deep, smooth baritone. Late-night DJ.",
  lAxf5ma5HGtzxC434SWT: "Confident, warm, and encouraging.",
};

// [age, nationality] from each voice's ElevenLabs labels, keyed by voice ID.
// The category list above overrides age; NATIONALITY_BY_NAME overrides
// nationality.
const AGE_NATIONALITY_BY_ELEVENLABS_ID = {
  CwhRBWXzGAHq8TQ4Fs17: ["Middle age", "American"],
  EXAVITQu4vr4xnSDxMaL: ["Young", "American"],
  FGY2WhTYpPnrIDTdsKH5: ["Young", "American"],
  IKne3meq5aSn9XLyUdCD: ["Young", "Australian"],
  JBFqnCBsd6RMkjVDRZzb: ["Middle age", "British"],
  N2lVS1w4EtoT3dr4eOWO: ["Middle age", "American"],
  SAz9YHcvj6GT2YYXdXww: ["Middle age", "American"],
  SOYHLrjzK2X1ezoPC6cr: ["Young", "American"],
  TX3LPaxmHKxFdv7VOQHJ: ["Young", "American"],
  Xb7hH8MSUJpSbSDYk0k2: ["Middle age", "British"],
  XrExE9yKIg1WjnnlVkGX: ["Middle age", "American"],
  bIHbv24MWmeRgasZH58o: ["Young", "American"],
  cgSgspJ2msm6clMCkdW9: ["Young", "American"],
  cjVigY5qzO86Huf0OWal: ["Middle age", "American"],
  hpp4J3VqNfWAUOO0d1Us: ["Middle age", "American"],
  iP95p4xoKVk53GoZ742B: ["Middle age", "American"],
  nPczCjzI2devNBz1zQrb: ["Middle age", "American"],
  onwK4e9ZLuTAKqWW03F9: ["Middle age", "British"],
  pFZP5JQG7iQjIQuC4Bku: ["Middle age", "British"],
  pNInz6obpgDQGcFmaJgB: ["Middle age", "American"],
  pqHfZKP75CvOlQylNhV4: ["Mature", "American"],
  BwsRV8gluuGcJrvENPbd: ["Mature", "American"],
  fDte6eby6sYdcYcjHbl0: ["Mature", "American"],
  tMvyQtpCVQ0DkixuYm6J: ["Middle age", "American"],
  L0Dsvb3SLTyegXwtm47J: ["Middle age", "British"],
  Xb3zeLrTi6F4ziIcXdwk: ["Young", "American"],
  "2bk7ULW9HfwvcIbMWod0": ["Young", "American"],
  lkVAP8k5tC0Wr1dYyQZH: ["Middle age", "American"],
  "5u41aNhyCU6hXOcjPPv0": ["Mature", "American"],
  "6wLJ4Wm2OxvAvetEUBCS": ["Young", "American"],
  aOcS60CY8CoaVaZfqqb5: ["Middle age", "American"],
  wBXNqKUATyqu0RtYt25i: ["Middle age", "American"],
  gPPH6SLdL8XSX6GNJ40G: ["Middle age", "American"],
  rI34FMqFgY9kQxffNV58: ["Middle age", "British"],
  "6O8E1UOlJbvkhJDpV0aB": ["Young", "American"],
  Rn9Yq7uum9irZ6RwppDN: ["Young", "American"],
  "8bRmOvh6tl1JtNu7uUdF": ["Mature", "British"],
  BNgbHR0DNeZixGQVzloa: ["Mature", "British"],
  iDEmt5MnqUotdwCIVplo: ["Middle age", "Spanish"],
  gbTn1bmCvNgk0QEAVyfM: ["Middle age", "Spanish"],
  eScsMiMALXY1bEJFNH8o: ["Mature", "American"],
  "34lPwSZ54D8fWbX1aHzk": ["Middle age", "American"],
  vBKc2FfBKJfcZNyEt1n6: ["Young", "American"],
  hHjbwzYZW17oh0p05AKv: ["Middle age", "Spanish"],
  Mac2FKpSgaGIsaNRXt8A: ["Young", "American"],
  Dslrhjl3ZpzrctukrQSN: ["Middle age", "American"],
  iLiLWmBplDMUW2SuUEnM: ["Middle age", ""],
  "8n9Xb8GOqw6yNVOQ6ewr": ["Young", "American"],
  zGjIP4SZlMnY9m93k97r: ["Young", "American"],
  "6F5Zhi321D3Oq7v1oNT4": ["Middle age", "American"],
  tnSpp4vdxKPjI9w0GnoV: ["Young", "American"],
  Q4CesJn2rW0ITUs66gST: ["Mature", ""],
  SaqYcK3ZpDKBAImA8AdW: ["Young", "American"],
  yM93hbw8Qtvdma2wCnJG: ["Young", "American"],
  "9oqLJH1XFK0K90OEebQ5": ["Mature", "American"],
  lxYfHSkYm1EzQzGhdbfc: ["Middle age", "American"],
  cBijDV6IOSWp9c8dA7Xn: ["Middle age", "American"],
  WA9uLg4JEEGnvosWUUIc: ["Young", "American"],
  CVRACyqNcQefTlxMj9bt: ["Young", "American"],
  "5f49vYETqZvJYfUP28fO": ["Middle age", "American"],
  DTKMou8ccj1ZaWGBiotd: ["Young", "American"],
  "7EzWGsX10sAS4c9m9cPf": ["Middle age", "American"],
  ii0s2u4R3UFnxKL6DOrz: ["Young", "American"],
  A9hvW90SK1w1iyI1xxf9: ["Young", "American"],
  xctasy8XvGp2cVO9HL9k: ["Young", "American"],
  "6rOxfAnZpbM3VIEhFaeV": ["Young", "American"],
  yPh7KyOT84PcyPINBrfi: ["Young", "American"],
  sQAyEY9ksexU3gWxo7gG: ["Young", "British"],
  VlUmeC1Uzj3NnwiVR9K9: ["Young", "American"],
  xHrx1s67XbIvR0zlXxsF: ["Middle age", "American"],
  DduhIyyKkOosbP8VefhP: ["Middle age", "American"],
  sDh3eviBhiuHKi0MjTNq: ["Middle age", "Spanish"],
  AiVXo6AkAsMPEX0qNgmP: ["Young", "American"],
  jA08rXmVrpvXnqEEEYwl: ["Young", "Indian"],
  DtsPFCrhbCbbJkwZsb3d: ["Young", "American"],
  nL7Nn9iAEdlXf7oChcj8: ["Middle age", "American"],
  wGcFBfKz5yUQqhqr0mVy: ["Mature", "American"],
  cCYjmrGZaI86GUJ7F2Nn: ["Middle age", "American"],
  kXsOSDWolD7e9l1Z0sbH: ["Young", "American"],
  zCgijgIKIMkFHnzXcCva: ["Middle age", "American"],
  RG7cEBfKE5GfK0ZP0uzl: ["Middle age", "American"],
  "6aDn1KB0hjpdcocrUkmq": ["Young", "American"],
  wAGzRVkxKEs8La0lmdrE: ["Mature", "American"],
  KHJAv6FBeaIDV1IplidF: ["Middle age", ""],
  dtSEyYGNJqjrtBArPCVZ: ["Young", "American"],
  aGkVQvWUZi16EH8aZJvT: ["Middle age", "Australian"],
  HKFOb9iktHA85uKXydRT: ["Middle age", "American"],
  lAxf5ma5HGtzxC434SWT: ["Young", "American"],
};

const NATIONALITY_BY_NAME = {
  Alejandro: "Spanish",
  Diego: "Spanish",
  Camila: "Spanish",
  Edward: "British",
  Archer: "British",
  Darcy: "British",
  Meg: "British",
  Oliver: "Australian",
  Puja: "Indian",
};

// 25 older voice docs carry an `age` in a legacy vocabulary.
const LEGACY_AGES = { young: "Young", "middle age": "Middle age", mature: "Mature", older: "Mature" };

// Matches DESCRIPTION_MAX_CHARS in src/lib/voicesShared.js.
const DESCRIPTION_MAX_CHARS = 43;

const CATEGORY_ORDER = SEED.map(([category]) => category);

function init() {
  if (admin.apps.length) return;
  admin.initializeApp({
    projectId,
    credential: admin.credential.applicationDefault(),
  });
}

function normalizeName(name) {
  return String(name)
    .toLowerCase()
    .replace(/\s*\(cloned\)\s*$/, "")
    .trim();
}

function sameList(a, b) {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

async function main() {
  const tooLong = Object.entries({ ...DESCRIPTIONS, ...DESCRIPTIONS_BY_ELEVENLABS_ID })
    .filter(([, d]) => d.length > DESCRIPTION_MAX_CHARS);
  if (tooLong.length) {
    throw new Error(`Descriptions over ${DESCRIPTION_MAX_CHARS} chars: ${JSON.stringify(tooLong)}`);
  }

  init();
  const db = admin.firestore();

  const [voicesSnap, choicesSnap, categoriesSnap] = await Promise.all([
    db.collection("pyro_voices").get(),
    db.doc("fetch_data_to_frontend/pyro_voices").get(),
    db.doc("fetch_data_to_frontend/pyro_voice_categories").get(),
  ]);
  const listed = new Set((choicesSnap.exists && choicesSnap.data().pyro_voice_choices) || []);

  // Index docs by exact (case-insensitive) name and by name minus "(Cloned)".
  const byExact = new Map();
  const byLoose = new Map();
  for (const doc of voicesSnap.docs) {
    const name = doc.data().pyro_name || "";
    byExact.set(name.toLowerCase(), doc);
    const loose = normalizeName(name);
    byLoose.set(loose, [...(byLoose.get(loose) || []), doc]);
  }

  const plan = new Map(); // doc.id -> { doc, categories:Set, description }
  const unmatched = [];
  const ambiguous = [];
  const genderMismatches = [];

  for (const [category, gender, names] of SEED) {
    for (const name of names) {
      let doc = byExact.get(name.toLowerCase());
      if (!doc) {
        const candidates = byLoose.get(normalizeName(name)) || [];
        if (candidates.length > 1) {
          ambiguous.push(`${name} → ${candidates.map((d) => d.data().pyro_name).join(", ")}`);
          continue;
        }
        doc = candidates[0];
      }
      if (!doc) {
        unmatched.push(`${name} (${category})`);
        continue;
      }
      const data = doc.data();
      const storedGender = (data.voice_preview_filename || "").split("/")[0];
      if (storedGender && storedGender !== gender) {
        genderMismatches.push(
          `${data.pyro_name}: listed under '${category}' but stored as ${storedGender}`
        );
      }
      const entry = plan.get(doc.id) || { doc, categories: new Set(), description: undefined };
      entry.categories.add(category);
      if (DESCRIPTIONS[name] !== undefined) entry.description = DESCRIPTIONS[name];
      // "Male · Middle age" → "Middle age"; accent categories carry no age.
      const age = category.split(" · ")[1];
      if (["Young", "Middle age", "Mature"].includes(age)) entry.age = age;
      if (NATIONALITY_BY_NAME[name]) entry.nationality = NATIONALITY_BY_NAME[name];
      plan.set(doc.id, entry);
    }
  }

  const existingCategories = (categoriesSnap.exists && categoriesSnap.data().categories) || [];
  const extraCategories = existingCategories.filter((c) => !CATEGORY_ORDER.includes(c));
  const nextCategories = [...CATEGORY_ORDER, ...extraCategories];

  // Descriptions, age and nationality only fill empty fields, so re-running never overwrites an
  // edit made on /admin/voices.
  const writes = [];
  const noDescription = [];
  for (const doc of voicesSnap.docs) {
    const data = doc.data();
    const entry = plan.get(doc.id);
    const update = {};
    if (entry) {
      const nextCats = CATEGORY_ORDER.filter((c) => entry.categories.has(c)).concat(
        (data.categories || []).filter((c) => extraCategories.includes(c))
      );
      if (!sameList(data.categories || [], nextCats)) update.categories = nextCats;
    }
    const description =
      entry?.description ?? DESCRIPTIONS_BY_ELEVENLABS_ID[data.elevenlabs_id];
    if (!data.description) {
      if (description) update.description = description;
      else noDescription.push(data.pyro_name);
    }
    const [elAge, elNationality] = AGE_NATIONALITY_BY_ELEVENLABS_ID[data.elevenlabs_id] || [];
    // Age: the category list wins, then a normalized legacy value, then
    // ElevenLabs. Legacy values are rewritten so the Age filter matches them.
    const legacyAge = LEGACY_AGES[String(data.age || "").trim().toLowerCase()];
    const age = entry?.age || legacyAge || elAge;
    const nationality = entry?.nationality || elNationality;
    if (age && data.age !== age) update.age = age;
    if (!data.nationality && nationality) update.nationality = nationality;
    if (Object.keys(update).length) writes.push({ doc, update });
  }

  const categorized = new Set([...plan.values()].map((e) => e.doc.data().pyro_name));
  const uncategorized = [...listed].filter((n) => !categorized.has(n)).sort();

  console.log(`Project: ${projectId || "(default)"}${isDryRun ? "  [DRY RUN]" : ""}`);
  console.log(`Voice docs: ${voicesSnap.size}, listed in Pyro: ${listed.size}`);
  console.log(`Matched: ${plan.size}`);
  console.log(`\nCategory list → ${nextCategories.join(" | ")}`);
  if (!sameList(existingCategories, nextCategories)) console.log("  (will be written)");
  console.log(`\nUnmatched names (${unmatched.length}):`);
  unmatched.forEach((n) => console.log(`  - ${n}`));
  if (ambiguous.length) {
    console.log(`\nAmbiguous names (${ambiguous.length}), skipped:`);
    ambiguous.forEach((n) => console.log(`  - ${n}`));
  }
  console.log(`\nGender mismatches (${genderMismatches.length}):`);
  genderMismatches.forEach((n) => console.log(`  - ${n}`));
  console.log(`\nListed voices left uncategorized (${uncategorized.length}):`);
  uncategorized.forEach((n) => console.log(`  - ${n}`));
  console.log(`\nVoices still without a description (${noDescription.length}):`);
  noDescription.sort().forEach((n) => console.log(`  - ${n}`));
  console.log(`\nVoice docs to update: ${writes.length}`);
  writes.forEach(({ doc, update }) =>
    console.log(`  - ${doc.data().pyro_name}: ${JSON.stringify(update)}`)
  );

  if (isDryRun) {
    console.log("\nDry run — nothing written.");
    return;
  }

  const batch = db.batch();
  if (!sameList(existingCategories, nextCategories)) {
    batch.set(
      db.doc("fetch_data_to_frontend/pyro_voice_categories"),
      {
        categories: nextCategories,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
  writes.forEach(({ doc, update }) => batch.update(doc.ref, update));
  await batch.commit();
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

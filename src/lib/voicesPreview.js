// Sample voice library for UI preview mode (local dev without Firebase env).
// Lets the admin voice page and Pyro's voice picker render categories and
// descriptions without reading Firestore. Never used in real builds.

export const PREVIEW_VOICE_CATEGORIES = [
  "Male · Young",
  "Male · Middle age",
  "Male · Mature",
  "Female · Young",
  "Female · Middle age",
  "Female · Mature",
  "Accents · Male",
  "Accents · Female",
];

function voice(pyro_name, gender, categories, description, age, nationality) {
  const slug = pyro_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return {
    id: slug,
    pyro_name,
    elevenlabs_id: "previewVoiceId0000000",
    voice_preview_filename: `${gender}/${slug}.mp3`,
    model_id: "eleven_multilingual_v2",
    stability: 0.5,
    similarity_boost: 0.75,
    categories,
    description,
    age,
    nationality,
  };
}

export const PREVIEW_VOICES = [
  voice("Alejandro", "male", ["Accents · Male"], "Spanish accent. Great for Spanish language.", "Middle age", "Spanish"),
  voice("Allison", "female", ["Female · Young"], "Fun millennial. Great for commercials.", "Young", "American"),
  voice("Brian", "male", ["Male · Middle age"], "Deep and comforting. Great for ads.", "Middle age", "American"),
  voice("Camila", "female", ["Accents · Female"], "Spanish accent. Great for Spanish language.", "Middle age", "Spanish"),
  voice("Carol", "female", ["Female · Mature"], "Confident older voice. Great for narration.", "Mature", "American"),
  voice("Charley", "male", ["Male · Young"], "Strong, expressive narrator.", "Young", "American"),
  voice("Edward", "male", ["Accents · Male"], "British accent", "Mature", "British"),
  voice("Emma", "female", ["Female · Middle age"], "Natural, warm, conversational.", "Middle age", "American"),
  voice("Finn", "male", ["Male · Young"], "Upbeat and conversational. Great for pods.", "Young", "American"),
  voice("Hank", "male", ["Male · Mature"], "Deep movie-trailer voice. Great for ads.", "Mature", "American"),
  voice("Meg", "female", ["Female · Middle age", "Accents · Female"], "British accent", "Middle age", "British"),
  voice("Oliver", "male", ["Accents · Male"], "Australian accent", "Middle age", "Australian"),
  voice("Puja", "female", ["Accents · Female"], "Indian accent", "Young", "Indian"),
  voice("Riley", "female", ["Female · Young"], "Natural and conversational.", "Young", "American"),
  voice("Uncategorized Example", "male", [], "Featured in WSPA spots.", "Mature", "American"),
];

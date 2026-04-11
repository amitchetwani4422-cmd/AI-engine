// ─────────────────────────────────────────────────────────────────────────────
// Music Library — royalty-free background tracks for Ramayana content
//
// HOW TO ADD TRACKS:
// 1. Go to https://pixabay.com/music/ or https://freemusicarchive.org
// 2. Search for Indian classical / devotional tracks
// 3. Download or get the direct CDN URL
// 4. Upload to your Cloudinary account (resource_type: "video")
// 5. Paste the Cloudinary CDN URL in the `url` field below
//
// VOLUME: 15 = 15% — narration stays clearly audible
// ─────────────────────────────────────────────────────────────────────────────

export interface MusicTrack {
  category: string;
  name: string;
  nameHindi: string;
  description: string;
  keywords: string[];
  url: string;       // Cloudinary CDN URL — empty = skip music for this mood
  cloudinaryPublicId: string; // set after uploading to Cloudinary
  volume: number;    // 0-100, mixed under narration
}

export const MUSIC_LIBRARY: Record<string, MusicTrack> = {
  devotional_calm: {
    category: "devotional_calm",
    name: "Devotional Calm",
    nameHindi: "भक्ति शांत",
    description: "Soft tanpura, temple bells, meditative — default for most Ramayana scenes",
    keywords: ["भक्ति", "शांत", "calm", "devotional", "prayer", "तानपुरा", "temple", "meditation", "आरती", "पूजा", "वंदना", "soft"],
    url: process.env.MUSIC_DEVOTIONAL_CALM_URL ?? "",
    cloudinaryPublicId: process.env.MUSIC_DEVOTIONAL_CALM_ID ?? "",
    volume: 15,
  },
  epic_heroic: {
    category: "epic_heroic",
    name: "Epic Heroic",
    nameHindi: "महाकाव्य वीर",
    description: "Powerful dhol, shankh, orchestral swell — for arrivals and victories",
    keywords: ["वीर", "epic", "heroic", "महाकाव्य", "शंख", "arrival", "victory", "जय", "राम", "शक्ति", "brave", "powerful"],
    url: process.env.MUSIC_EPIC_HEROIC_URL ?? "",
    cloudinaryPublicId: process.env.MUSIC_EPIC_HEROIC_ID ?? "",
    volume: 18,
  },
  battle: {
    category: "battle",
    name: "Battle Intense",
    nameHindi: "युद्ध",
    description: "Intense drums, war percussion — for battle and conflict scenes",
    keywords: ["युद्ध", "battle", "war", "fight", "intense", "conflict", "लड़ाई", "संग्राम", "तनाव", "dramatic", "action"],
    url: process.env.MUSIC_BATTLE_URL ?? "",
    cloudinaryPublicId: process.env.MUSIC_BATTLE_ID ?? "",
    volume: 20,
  },
  sorrowful: {
    category: "sorrowful",
    name: "Sorrowful",
    nameHindi: "करुण विलाप",
    description: "Slow flute, melancholic strings — for exile, separation, grief",
    keywords: ["करुण", "दुख", "sad", "sorrow", "grief", "separation", "exile", "वियोग", "विरह", "slow", "flute", "melancholic", "उदास", "दर्द"],
    url: process.env.MUSIC_SORROWFUL_URL ?? "",
    cloudinaryPublicId: process.env.MUSIC_SORROWFUL_ID ?? "",
    volume: 12,
  },
  celestial: {
    category: "celestial",
    name: "Celestial Divine",
    nameHindi: "दिव्य",
    description: "Ethereal, cosmic, divine energy — for deva appearances and blessings",
    keywords: ["दिव्य", "celestial", "divine", "cosmic", "glowing", "holy", "sacred", "देव", "आकाश", "स्वर्ग", "ethereal", "heavenly", "magical"],
    url: process.env.MUSIC_CELESTIAL_URL ?? "",
    cloudinaryPublicId: process.env.MUSIC_CELESTIAL_ID ?? "",
    volume: 15,
  },
};

// Select best music category based on script's musicMood text
export function selectMusicCategory(musicMood: string): MusicTrack {
  const mood = musicMood.toLowerCase();

  // Score each category by keyword matches
  const scores = Object.values(MUSIC_LIBRARY).map((track) => ({
    track,
    score: track.keywords.filter((kw) => mood.includes(kw.toLowerCase())).length,
  }));

  scores.sort((a, b) => b.score - a.score);

  // Return best match; fall back to devotional_calm (most common for Ramayana)
  const best = scores[0];
  return best.score > 0 ? best.track : MUSIC_LIBRARY.devotional_calm;
}

// Category display for UI
export const MUSIC_CATEGORY_LABELS: Record<string, string> = {
  devotional_calm: "🪔 Devotional Calm",
  epic_heroic: "⚔️ Epic Heroic",
  battle: "🥁 Battle",
  sorrowful: "🪈 Sorrowful",
  celestial: "✨ Celestial",
};

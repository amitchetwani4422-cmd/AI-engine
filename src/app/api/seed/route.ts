export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const CHANNELS = [
  {
    name: "DevLok",
    niche: "Hindu Mythology & Dev Stories",
    universe: "A",
    targetAudience: "18-35 spiritual/mythology enthusiasts, Hindi-speaking diaspora",
    primaryPlatform: "YouTube",
    secondaryPlatform: "Instagram",
    language: "Hindi",
    postingFrequency: "3x/week",
    contentPillars: [
      "Dev origin stories",
      "Epic battles from Puranas",
      "Cosmic events & avatars",
      "Hidden mythology facts",
      "Moral tales from Mahabharata/Ramayana",
    ],
    visualStyle:
      "Epic cinematic — golden hour lighting, jewel-toned palettes, divine glow effects, grand temples and cosmic vistas",
    voiceStyle:
      "Deep, reverent narrator — authoritative yet accessible, occasional Sanskrit",
    monetizationPriority: 1,
    status: "Active",
    defaultModelPref: "veo-heavy",
    maxBudgetPerVideo: 15,
    maxBudgetPerWeek: 75,
    formatStrategy:
      "3-5 min YouTube shorts hybrid: hook (15s) → myth reveal → cinematic scene → moral close",
    repurposingRules:
      "Cut 60s version for Instagram Reels; thumbnail must show deity face prominently",
  },
  {
    name: "BhaktiSwar",
    niche: "Devotional & Bhakti Content",
    universe: "A",
    targetAudience: "25-55 devotional audience, temple-goers, spiritual seekers",
    primaryPlatform: "YouTube",
    secondaryPlatform: "Facebook",
    language: "Hindi",
    postingFrequency: "5x/week",
    contentPillars: [
      "Morning aarti visuals",
      "Bhajan visualization",
      "Festival specials",
      "Pilgrimage journeys",
      "Saint stories",
    ],
    visualStyle:
      "Warm, devotional — soft saffron and gold tones, incense smoke effects, temple architecture, peaceful deities",
    voiceStyle: "Calm, melodious, devotional tone — like a temple priest reading",
    monetizationPriority: 2,
    status: "Active",
    defaultModelPref: "kling-heavy",
    maxBudgetPerVideo: 8,
    maxBudgetPerWeek: 40,
    formatStrategy:
      "2-4 min ambient devotional videos; festival shorts go viral; pair with bhajan audio",
    repurposingRules:
      "WhatsApp-friendly 60s cuts; vertical format for Reels; add subtitle text for silent viewing",
  },
  {
    name: "ToonVerse",
    niche: "Original Cartoon Characters & Animated Stories",
    universe: "B",
    targetAudience: "6-14 kids + nostalgic 20-35 adults, global English audience",
    primaryPlatform: "YouTube",
    secondaryPlatform: "Instagram",
    language: "English",
    postingFrequency: "3x/week",
    contentPillars: [
      "Character origin episodes",
      "Friendship & adventure arcs",
      "Comedy shorts",
      "Holiday specials",
      "Villain vs hero clashes",
    ],
    visualStyle:
      "Bright, vibrant 2.5D animation aesthetic — bold outlines, exaggerated expressions, saturated colors, comic-book panels",
    voiceStyle: "Energetic, playful narrator — fast pacing, fun sound effects",
    monetizationPriority: 1,
    status: "Active",
    defaultModelPref: "kling-heavy",
    maxBudgetPerVideo: 12,
    maxBudgetPerWeek: 60,
    formatStrategy:
      "5-8 min episodic YouTube content with cliffhangers; 30s teasers for Shorts/Reels",
    repurposingRules:
      "Character highlight clips for Shorts; reaction thumbnails perform best; keep lore consistent",
  },
  {
    name: "BeastBit",
    niche: "Creature & Mascot Universe",
    universe: "B",
    targetAudience: "10-25 gamers, creature-design fans, fantasy/sci-fi audience",
    primaryPlatform: "YouTube",
    secondaryPlatform: "TikTok",
    language: "English",
    postingFrequency: "4x/week",
    contentPillars: [
      "Creature ability reveals",
      "Beast battles",
      "World-building lore drops",
      "Evolution arcs",
      "Community fan creatures",
    ],
    visualStyle:
      "Dark fantasy meets game cinematic — moody lighting, bioluminescent accents, battle smoke, dynamic creature angles",
    voiceStyle:
      "Hype announcer style — cinematic drops, mysterious lore tone for backstories",
    monetizationPriority: 2,
    status: "Testing",
    defaultModelPref: "veo-heavy",
    maxBudgetPerVideo: 14,
    maxBudgetPerWeek: 70,
    formatStrategy:
      "60-90s creature reveal Shorts + 5 min lore deep-dives; fan votes drive creature designs",
    repurposingRules:
      "TikTok gets 30s battle clips; Reddit-style 'who would win' thumbnails; always end with cliffhanger",
  },
  {
    name: "AgniBhojan",
    niche: "Cinematic Cooking Spectacle",
    universe: "C",
    targetAudience: "20-45 food lovers, ASMR fans, travel-food enthusiasts globally",
    primaryPlatform: "YouTube",
    secondaryPlatform: "Instagram",
    language: "English",
    postingFrequency: "4x/week",
    contentPillars: [
      "Street food cinematics",
      "Ancient recipe recreations",
      "Fire cooking techniques",
      "Regional Indian cuisine spotlights",
      "Extreme portion / feast videos",
    ],
    visualStyle:
      "Ultra-cinematic food — macro lens steam shots, golden oil pours, fire sparks, slow-motion sizzle, deep warm tones",
    voiceStyle:
      "Lush, sensory narrator — evocative, ASMR-influenced, slightly theatrical",
    monetizationPriority: 1,
    status: "Active",
    defaultModelPref: "kling-heavy",
    maxBudgetPerVideo: 10,
    maxBudgetPerWeek: 50,
    formatStrategy:
      "60-90s hypnotic food Shorts are primary growth driver; 5-10 min documentaries for long-form",
    repurposingRules:
      "Isolate sizzle moments for 15s Reels; ingredient close-ups as standalone ASMR Shorts; add location text overlays",
  },
];

export async function POST() {
  const results: string[] = [];

  for (const channel of CHANNELS) {
    const existing = await prisma.channel.findFirst({ where: { name: channel.name } });
    if (existing) {
      results.push(`skip: ${channel.name}`);
      continue;
    }
    await prisma.channel.create({ data: channel });
    results.push(`created: ${channel.name}`);
  }

  return NextResponse.json({ ok: true, results });
}

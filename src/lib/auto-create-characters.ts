/**
 * auto-create-characters.ts
 *
 * When a script is generated and mentions character names that don't yet
 * exist in the DB, this utility auto-creates them with AI-generated visual
 * profiles so that:
 *   1. characterIds are populated correctly in every scene
 *   2. The character appears immediately in /characters for review/editing
 *   3. All future scenes/videos reuse the same consistent profile
 */

import prisma from '@/lib/prisma';
import { generateWithModel } from '@/lib/ai-provider';

interface CreatedCharacter {
  id: string;
  name: string;
  wasCreated: boolean; // true = new, false = already existed
}

/**
 * Ensures every name in `names` has a Character record for `channelId`.
 * Missing characters are auto-created with AI-generated visual profiles.
 *
 * Returns an updated name→id map that includes both existing and newly created chars.
 */
export async function ensureCharactersExist(
  names: string[],
  channelId: string,
  existingLookup: Map<string, string>,
): Promise<{ lookup: Map<string, string>; created: CreatedCharacter[] }> {
  const created: CreatedCharacter[] = [];

  // Deduplicate and find which names are missing
  const uniqueNames = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  const missing = uniqueNames.filter((n) => !existingLookup.has(n.toLowerCase()));

  if (missing.length === 0) return { lookup: existingLookup, created };

  // Auto-create each missing character in parallel
  await Promise.all(
    missing.map(async (name) => {
      try {
        // Generate rich visual profile via AI
        const profileJson = await generateWithModel(
          'gpt-4o-mini',
          `You generate detailed visual character profiles for AI video generation (Kling, Veo, LTX).
Output ONLY valid JSON — no markdown, no explanation.`,
          `Create a photorealistic visual profile for "${name}" from ancient Indian mythology / the Ramayana epic.
Use your knowledge of Valmiki Ramayana and ancient Indian iconography.

Output this exact JSON (all fields required):
{
  "speciesOrType": "Human or Divine or Demon or Vanara or Sage or Rakshasi",
  "personality": "one-sentence personality (e.g. 'wise, serene, deeply revered sage with prophetic insight')",
  "worldRole": "one-sentence role in the Ramayana story",
  "referencePrompt": "5-sentence photorealistic cinematographer's description — must cover: (1) exact skin tone + divine glow or aura, (2) facial features + beard/hair + expression, (3) clothing: exact fabric type, primary color, embroidery patterns, draping style, (4) ornaments: crown/headgear, necklaces, armlets, earrings, sacred thread if applicable, (5) attributes/weapons/objects held + body posture",
  "colorPalette": ["primary_clothing_color", "secondary_color", "accent_or_glow_color"],
  "clothingRules": "specific rules for this character's appearance that must never change: primary garment + color + fabric + key ornaments",
  "restrictedChanges": ["what must always remain constant — e.g. 'white flowing robes'", "another unchangeable visual element"]
}`,
          700,
        );

        let profile: Record<string, unknown>;
        try {
          profile = JSON.parse(profileJson.trim().replace(/^```json\n?|\n?```$/g, ''));
        } catch {
          console.error(`[auto-create-characters] JSON parse failed for "${name}"`);
          return;
        }

        const char = await prisma.character.create({
          data: {
            channelId,
            name,
            speciesOrType: (profile.speciesOrType as string) || 'Human',
            personality:   (profile.personality   as string) || '',
            worldRole:     (profile.worldRole      as string) || '',
            referencePrompt: (profile.referencePrompt as string) || '',
            colorPalette:  Array.isArray(profile.colorPalette)  ? (profile.colorPalette  as string[]) : [],
            clothingRules: (profile.clothingRules  as string) || '',
            restrictedChanges: Array.isArray(profile.restrictedChanges) ? (profile.restrictedChanges as string[]) : [],
            universeId:    'ramayana',
            preferredModel: 'kling-3.0',
            visualReferences:    [],
            approvedImages:      [],
            approvedExpressions: [],
            samplePoses:         [],
            seriesIds:           [],
          },
        });

        existingLookup.set(name.toLowerCase(), char.id);
        created.push({ id: char.id, name, wasCreated: true });
        console.log(`[auto-create-characters] Created character "${name}" (${char.id})`);
      } catch (err) {
        // Non-fatal — scene generation still works, just without this character's guide
        console.error(`[auto-create-characters] Failed to create "${name}":`, err);
      }
    }),
  );

  return { lookup: existingLookup, created };
}

// Canonical English name → all recognised variants (Hindi + spelling alternates)
// Mirrors the alias map in generate-scene so extraction and matching are consistent.
const RAMAYANA_CANONICAL: Record<string, string> = {
  'राम': 'Ram', 'श्री राम': 'Ram', 'rama': 'Ram', 'shri ram': 'Ram', 'lord ram': 'Ram',
  'सीता': 'Sita', 'sita mata': 'Sita', 'janaki': 'Sita', 'maithili': 'Sita', 'vaidehi': 'Sita',
  'हनुमान': 'Hanuman', 'bajrangbali': 'Hanuman', 'pawanputra': 'Hanuman',
  'लक्ष्मण': 'Lakshman', 'laxman': 'Lakshman', 'lakshmana': 'Lakshman', 'saumitra': 'Lakshman',
  'रावण': 'Ravan', 'ravana': 'Ravan', 'dashanan': 'Ravan', 'dashagriva': 'Ravan',
  'दशरथ': 'Dasharath', 'dasharatha': 'Dasharath', 'dashrath': 'Dasharath',
  'कौशल्या': 'Kaushalya', 'kausalya': 'Kaushalya',
  'कैकेयी': 'Kaikeyi', 'kekeyi': 'Kaikeyi',
  'वशिष्ठ': 'Vashishtha', 'vasishtha': 'Vashishtha', 'vasistha': 'Vashishtha',
  'maharishi vashishtha': 'Vashishtha', 'maharishi vasishtha': 'Vashishtha',
  'विश्वामित्र': 'Vishwamitra', 'vishvamitra': 'Vishwamitra',
  'सुग्रीव': 'Sugriva', 'sugreeva': 'Sugriva',
  'विभीषण': 'Vibhishan', 'vibhishana': 'Vibhishan',
  'जटायु': 'Jatayu',
  'शबरी': 'Shabari', 'sabari': 'Shabari',
  'मंदोदरी': 'Mandodari', 'mandodhari': 'Mandodari',
  'मंथरा': 'Manthara',
  'भरत': 'Bharat', 'bharata': 'Bharat',
  'शत्रुघ्न': 'Shatrughan', 'shatrughna': 'Shatrughan',
  'अंगद': 'Angad', 'angada': 'Angad',
  'जामवंत': 'Jambavan', 'jambavant': 'Jambavan',
  'शूर्पणखा': 'Shurpanakha', 'surpanakha': 'Shurpanakha',
  'कुंभकर्ण': 'Kumbhakarna', 'kumbhakaran': 'Kumbhakarna',
  'इंद्रजीत': 'Indrajit', 'meghnad': 'Indrajit', 'meghanad': 'Indrajit',
  'वाली': 'Vali', 'bali': 'Vali',
};

/**
 * Extracts all character names mentioned in AI-generated scene data.
 * Pulls from dialogue character fields (most reliable) + English prompts.
 * Normalises Hindi names and spelling variants to canonical English DB names.
 */
export function extractCharacterNames(
  scenes: Array<{
    dialogues?: Array<{ character: string; text: string }> | null;
    prompt?: string | null;
    promptEn?: string | null;
    description?: string | null;
    narrationText?: string | null;
  }>,
  knownNames: string[],
): string[] {
  const names = new Set<string>();

  for (const scene of scenes) {
    // Dialogue character fields — always in English from AI output
    scene.dialogues?.forEach((d) => {
      if (d.character?.trim()) {
        const canonical = RAMAYANA_CANONICAL[d.character.trim().toLowerCase()];
        names.add(canonical ?? d.character.trim());
      }
    });

    // Scan all text fields for known names and alias variants
    const allText = [scene.prompt, scene.promptEn, scene.description, scene.narrationText]
      .filter(Boolean).join(' ').toLowerCase();

    // Check existing DB names
    for (const known of knownNames) {
      if (allText.includes(known.toLowerCase())) names.add(known);
    }
    // Check alias variants → map back to canonical English name
    for (const [variant, canonical] of Object.entries(RAMAYANA_CANONICAL)) {
      if (allText.includes(variant.toLowerCase())) names.add(canonical);
    }
  }

  return [...names];
}

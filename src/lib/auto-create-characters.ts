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

/**
 * Extracts all character names mentioned in AI-generated scene data.
 * Pulls from dialogue `character` fields (most reliable — always English)
 * and optionally from prompt text (English).
 */
export function extractCharacterNames(
  scenes: Array<{
    dialogues?: Array<{ character: string; text: string }> | null;
    prompt?: string | null;
    promptEn?: string | null;
  }>,
  knownNames: string[], // existing character names in the DB — used for prompt scanning
): string[] {
  const names = new Set<string>();

  for (const scene of scenes) {
    // Dialogue character fields are the most reliable source
    scene.dialogues?.forEach((d) => {
      if (d.character?.trim()) names.add(d.character.trim());
    });

    // Also scan English prompts for known-name mentions (handles narrator-only scenes)
    const promptText = [scene.prompt, scene.promptEn].filter(Boolean).join(' ').toLowerCase();
    for (const known of knownNames) {
      if (promptText.includes(known.toLowerCase())) names.add(known);
    }
  }

  return [...names];
}

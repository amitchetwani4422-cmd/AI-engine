export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { generateWithModel, DEFAULT_SCRIPT_MODEL } from "@/lib/ai-provider";
import type { AIModel } from "@/lib/ai-provider";
import {
  RAMAYANA_KANDAS,
  RAMAYANA_KNOWLEDGE_BASE,
  getKandaKnowledge,
  isRamayanaContext,
} from "@/lib/mythology-knowledge";

const GenerateScriptSchema = z.object({
  ideaId: z.string().min(1),
  channelId: z.string().min(1),
  formatVariant: z.string().optional(),
  aiModel: z.string().optional(),
});

interface SceneData {
  sequenceNumber: number;
  description: string;
  duration: number;
  modelAssigned: string;
  routingReason: string;
  cameraDirection: string;
  visualGuidance: string;
  prompt?: string | null;
}


function detectRelevantKandas(tags: string[], title: string, description: string) {
  const corpus = `${tags.join(" ")} ${title} ${description}`.toLowerCase();
  return RAMAYANA_KANDAS.filter((kanda) =>
    corpus.includes(kanda.toLowerCase()) || corpus.includes(kanda.toLowerCase().replace(/\s+/g, "-"))
  );
}

function buildMythologyContext(tags: string[], title: string, description: string): string {
  if (!isRamayanaContext(tags, `${title} ${description}`)) {
    return "";
  }

  const corpus = `${tags.join(" ")} ${title} ${description}`.toLowerCase();
  const relevantCharacters = RAMAYANA_KNOWLEDGE_BASE.characterProfiles.filter((character) =>
    [character.name, ...character.aliases].some((name) => corpus.includes(name.toLowerCase()))
  );

  const characters = (relevantCharacters.length > 0 ? relevantCharacters : RAMAYANA_KNOWLEDGE_BASE.characterProfiles)
    .map((character) => `- ${character.name}: ${character.visualDescription} Traits: ${character.canonicalTraits.join(", ")}. Prompt rule: ${character.promptBlock}`)
    .join("\n");

  const relevantKandas = detectRelevantKandas(tags, title, description);
  const mantraSource = relevantKandas.length > 0
    ? relevantKandas.flatMap((kandaName) => getKandaKnowledge(kandaName)?.recommendedMantras ?? [])
    : Object.values(RAMAYANA_KNOWLEDGE_BASE.kandas).flatMap((kanda) => kanda.recommendedMantras);

  const mantraBank = Array.from(new Map(mantraSource.map((m) => [m.id, m])).values())
    .slice(0, 8)
    .map((mantra) => `- ${mantra.sanskrit} | ${mantra.transliteration} | ${mantra.translation}`)
    .join("\n");

  const scopedAccuracyRules = [
    ...RAMAYANA_KNOWLEDGE_BASE.globalAccuracyRules,
    ...(relevantKandas.length > 0
      ? relevantKandas.flatMap((kandaName) => getKandaKnowledge(kandaName)?.mustIncludeThemes ?? []).map((theme) => `Ensure ${theme}`)
      : []),
  ];

  return `MYTHOLOGY FAITHFULNESS CONTEXT (MANDATORY FOR THIS IDEA):
- Treat this as Ramayana-canon storytelling with devotional respect.
- Maintain traditional character relationships, chronology, and dharmic tone.

RELEVANT KANDA FOCUS:
${relevantKandas.length > 0 ? relevantKandas.map((k) => `- ${k}`).join("\n") : "- Not explicitly tagged; remain canon-safe across all Kandas."}

CANONICAL CHARACTER VISUAL PROFILES:
${characters}

ACCURACY RULES:
${scopedAccuracyRules.map((rule) => `- ${rule}`).join("\n")}

FORBIDDEN MISTAKES:
${RAMAYANA_KNOWLEDGE_BASE.forbiddenMistakes.map((rule) => `- ${rule}`).join("\n")}

SANSKRIT MANTRA BANK (use 1-2 where narratively appropriate):
${mantraBank}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = GenerateScriptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { ideaId, channelId, formatVariant, aiModel } = parsed.data;
    const model = (aiModel ?? DEFAULT_SCRIPT_MODEL) as AIModel;

    const [idea, channel] = await Promise.all([
      prisma.idea.findUnique({ where: { id: ideaId } }),
      prisma.channel.findUnique({
        where: { id: channelId },
        include: { styleBible: true },
      }),
    ]);

    if (!idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const styleGuide = channel.styleBible
      ? `Visual Style: ${channel.visualStyle}
Lighting: ${channel.styleBible.lightingPreferences}
Camera Feel: ${channel.styleBible.cameraFeel}
Music Direction: ${channel.styleBible.musicDirection}
Narration Tone: ${channel.styleBible.narrationTone}`
      : `Visual Style: ${channel.visualStyle}
Voice Style: ${channel.voiceStyle}`;

    const systemPrompt = `You are a professional video scriptwriter and AI video director specializing in AI-generated content for YouTube and short-form platforms.
You write production-ready scripts AND detailed AI video generation prompts optimized for Kling 1.6 Pro (the FAL.AI video model).
A great Kling prompt is 3-5 specific sentences covering: subject+action, environment/setting, camera movement, and lighting/atmosphere.
Always respond with valid JSON only, no markdown, no commentary.`;

    const userPrompt = `Create a complete script and scene-by-scene production breakdown for this video:

CHANNEL: ${channel.name}
PLATFORM: ${channel.primaryPlatform}
NICHE: ${channel.niche}
LANGUAGE: ${channel.language}
FORMAT: ${formatVariant ?? 'Standard'}

VIDEO IDEA: ${idea.title}
DESCRIPTION: ${idea.description}
TAGS: ${idea.tags.join(', ')}

${buildMythologyContext(idea.tags, idea.title, idea.description)}

CHANNEL STYLE GUIDE (apply this to every scene prompt):
${styleGuide}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — DEFINE THE WORLD SETTING FIRST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Before writing any scenes, define a "worldSetting" — a single paragraph (4-6 sentences) that describes the visual world this entire video takes place in. This ensures ALL scenes look like they belong to the same movie.

worldSetting must cover:
- TIME PERIOD & LOCATION TYPE: ancient Indian mythological realm / cosmic divine plane / Himalayan peak / celestial court etc.
- ARCHITECTURAL STYLE: specific type of temples, pillars, carvings, materials (sandstone, black granite, white marble, etc.)
- RECURRING BACKGROUND ELEMENTS: which elements appear in most scenes (sacred fire, lotuses, rivers, clouds, stars)
- COLOR PALETTE: the 2-3 dominant colors that define the world (deep indigo + gold + orange / emerald + silver + white etc.)
- ATMOSPHERE & LIGHTING QUALITY: what kind of light exists in this world (volumetric god rays, soft moonlight, eternal sunset, etc.)
- SIGNATURE DETAIL: one unique visual signature that appears across scenes for continuity

EXAMPLE worldSetting:
"An ancient mythological realm existing between the mortal world and the heavens, set in a vast temple complex of black granite carved with intricate bas-relief carvings of celestial battles and divine beings. Sacred fire pits line stone-paved courtyards, lotus flowers float on still reflective pools, and columns of sandstone rise 50 feet tall draped in marigold garlands. The atmosphere is thick with golden divine mist and floating flower petals. The dominant color palette is deep indigo sky, warm amber stone, and radiant gold light. A persistent visual signature: volumetric shafts of golden light breaking through stone archways at 45 degrees, casting long dramatic shadows."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — BACKGROUND DEPTH RULE (every scene)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every scene background must have 3 depth layers — this creates cinematic depth:

FOREGROUND (closest to camera): atmospheric element — fire, mist, lotus petals, incense smoke, falling flowers, water ripples, candle flames
MIDGROUND: where the character exists — ground surface, ritual items, surrounding environment
BACKGROUND: architectural/natural environment — temple walls, mountain peaks, divine sky, cosmic space

BACKGROUND BY SHOT TYPE:
- Wide/establishing shots: Show all 3 layers fully. Background has maximum architectural/environmental detail.
- Medium shots (waist-up): Foreground slightly blurred, background softly focused — show 2-3 background elements.
- Close-up shots (face/hands): Foreground element visible at edge, background is a soft bokeh of the world's color palette — DON'T put busy detail behind a face.
- Action shots: Dynamic background matching the motion — swirling elements, motion blur on bg while subject is sharp.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — HOW TO WRITE THE SCENE "prompt" FIELD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Each scene's "prompt" is sent directly to Kling 1.6 Pro AI video model.
It MUST follow this 4-part structure in 3-5 sentences. ALL backgrounds must reference the worldSetting.

PART 1 — SUBJECT & ACTION: Who/what is in frame, what they are doing.
  Include: character appearance, clothing details, colors, expression, specific gesture or motion.
  BAD: "A god appears with divine energy"
  GOOD: "Lord Vishnu stands with all four arms raised, holding a golden conch, chakra, lotus, and mace, his dark blue skin draped in golden silk dhoti and jeweled crown, eyes open with calm cosmic authority"

PART 2 — 3-LAYER ENVIRONMENT: Foreground atmospheric element + midground character space + background architecture. Must be consistent with worldSetting.
  BAD: "Epic background with temples"
  GOOD: "Drifting marigold petals and incense smoke blur in the foreground; the character stands on sacred stone steps engraved with lotus motifs; behind them, the black granite temple towers rise against a deep indigo sky, shafts of golden light breaking through the archway at 45 degrees"

PART 3 — CAMERA MOVEMENT: Exact shot type and movement arc.
  Include: starting position → movement → ending position.
  BAD: "Wide shot"
  GOOD: "Camera begins at low ground angle looking up through the foreground flame, slowly cranes upward and back to reveal the full divine figure against the temple spire and sky"

PART 4 — LIGHTING & ATMOSPHERE: Specific light quality, color palette, volumetric effects. Must match worldSetting palette.
  BAD: "Dramatic lighting"
  GOOD: "Warm amber torch light from below right, volumetric gold god rays from upper left piercing through stone archway, deep indigo and amber color palette, sacred fire glow reflecting off wet stone"

EXAMPLE COMPLETE PROMPT (mythology scene):
"Lord Shiva sits in cross-legged meditation on a flat rock, ash-white skin with sacred blue throat, crescent moon in matted locks, third eye faintly glowing amber, draped in tiger skin with serpent coiled at wrist, expression of absolute stillness. In the foreground, a sacred fire burns in a stone pit, its smoke drifting upward; Shiva sits in the midground on the rock plateau; behind him, the black granite temple walls of the divine complex rise against a pre-dawn indigo sky blazing with stars. The camera starts at ground level behind the sacred flame and slowly cranes upward in a majestic arc, the fire framing the lower portion as the full divine figure is revealed against the cosmos. Deep blue and silver moonlight dominates the scene, with warm amber fire glow creating contrast in the foreground; volumetric golden shafts break through the temple archway to the left, casting long diagonal shadows on stone."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "hook": "Opening 3-second hook narration — must grab attention immediately",
  "fullScript": "Complete narration script with all scene dialogues/VO from start to finish",
  "narrationDraft": "Natural, conversational speaking version of the full narration",
  "worldSetting": "4-6 sentence paragraph defining the visual world: time period, architecture style, recurring elements, color palette, atmosphere, signature detail — used for background consistency across ALL scenes",
  "titleOptions": ["Click-worthy title 1", "Click-worthy title 2", "Click-worthy title 3"],
  "thumbnailConcepts": [
    "Thumbnail 1: specific composition — foreground subject, background, text overlay color/position, emotional expression",
    "Thumbnail 2: alternative concept with different framing"
  ],
  "musicMood": "Specific description e.g. 'Epic orchestral with rising strings and tabla percussion, building to dramatic climax'",
  "scenes": [
    {
      "sequenceNumber": 1,
      "description": "Narrative purpose — what story beat or emotion does this scene serve",
      "duration": 5,
      "modelAssigned": "kling-3.0",
      "routingReason": "Brief reason for model choice",
      "cameraDirection": "Specific shot type + movement, e.g. 'Low-angle push-in from knee level rising to medium shot as subject stands'",
      "visualGuidance": "Art direction: dominant colors, mood, background depth layers (foreground/midground/background), key visual elements",
      "prompt": "FULL 3-5 SENTENCE KLING PROMPT — Part1: subject+action, Part2: 3-layer environment referencing worldSetting, Part3: camera movement, Part4: lighting+atmosphere matching worldSetting palette"
    }
  ]
}

MODEL ROUTING:
- "kling-3.0" for ALL scenes by default (action, movement, characters, establishing shots, everything)
- "veo-3.1" ONLY for scenes requiring real lip-sync audio — maximum 1 scene per video

DURATION:
- 5 seconds: most scenes (character close-ups, dialogue moments, action beats)
- 10 seconds: sweeping establishing shots, epic reveals, slow cinematic moments
- Target 55–70 seconds total across all scenes (aim for 8–12 scenes)

CRITICAL RULES:
1. Write worldSetting FIRST before any scenes — every scene background must be consistent with it
2. Every "prompt" must have 3-layer background: foreground atmospheric element, midground character space, background architecture/nature
3. Close-up shots: simple bokeh background in world's color palette — no busy details behind faces
4. Wide shots: full 3-layer environment with maximum architectural detail
5. Minimum 3 full sentences per prompt. No one-liners. No vague terms like "epic" or "dramatic" alone.
6. If mythology faithfulness context is present, it is mandatory and overrides creative liberties that break canon.`;

    const rawContent = await generateWithModel(model, systemPrompt, userPrompt, 8192);

    let scriptData: {
      hook: string;
      fullScript: string;
      narrationDraft: string;
      worldSetting?: string;
      titleOptions: string[];
      thumbnailConcepts: string[];
      musicMood: string;
      scenes: SceneData[];
    };

    try {
      const jsonStr = rawContent.trim().replace(/^```json\n?|\n?```$/g, '');
      scriptData = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI script response', raw: rawContent },
        { status: 500 }
      );
    }

    // Create script with scenes in a transaction
    const script = await prisma.$transaction(async (tx) => {
      const newScript = await tx.script.create({
        data: {
          ideaId,
          channelId,
          title: idea.title,
          formatVariant: formatVariant ?? 'Standard',
          hook: scriptData.hook,
          fullScript: scriptData.fullScript,
          narrationDraft: scriptData.narrationDraft,
          description: scriptData.worldSetting ?? null, // world setting for background consistency
          titleOptions: scriptData.titleOptions,
          thumbnailConcepts: scriptData.thumbnailConcepts,
          musicMood: scriptData.musicMood,
          status: 'Draft',
        },
      });

      if (scriptData.scenes && scriptData.scenes.length > 0) {
        await tx.scene.createMany({
          data: scriptData.scenes.map((scene) => ({
            scriptId: newScript.id,
            sequenceNumber: scene.sequenceNumber,
            description: scene.description,
            duration: scene.duration,
            modelAssigned: scene.modelAssigned,
            routingReason: scene.routingReason,
            cameraDirection: scene.cameraDirection,
            visualGuidance: scene.visualGuidance,
            prompt: scene.prompt ?? null,
            characterIds: [],
          })),
        });
      }

      // Update idea status
      await tx.idea.update({
        where: { id: ideaId },
        data: { status: 'InProduction' },
      });

      return newScript;
    });

    const fullScript = await prisma.script.findUnique({
      where: { id: script.id },
      include: {
        sceneBreakdown: { orderBy: { sequenceNumber: 'asc' } },
        idea: { select: { id: true, title: true } },
        channel: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(fullScript, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('POST /api/scripts/generate error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

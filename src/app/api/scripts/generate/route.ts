export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { generateWithModel, DEFAULT_SCRIPT_MODEL } from "@/lib/ai-provider";
import type { AIModel } from "@/lib/ai-provider";

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

CHANNEL STYLE GUIDE (apply this to every scene prompt):
${styleGuide}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW TO WRITE THE SCENE "prompt" FIELD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Each scene's "prompt" is sent directly to Kling 1.6 Pro AI video model.
It MUST follow this 4-part structure in 3-5 sentences:

PART 1 — SUBJECT & ACTION: Who/what is in frame, what they are doing.
  Include: character appearance, clothing details, colors, expression, specific gesture or motion.
  BAD: "A god appears with divine energy"
  GOOD: "Lord Vishnu stands with all four arms raised, holding a golden conch, chakra, lotus, and mace, his dark blue skin draped in golden silk dhoti and jeweled crown, eyes open with calm cosmic authority"

PART 2 — ENVIRONMENT & SETTING: Where is this happening? Be architectural/atmospheric.
  Include: location, time of day, background layers, specific elements (temples, mountains, fire, water).
  BAD: "Epic background with temples"
  GOOD: "Towering ancient stone temples with carved bas-relief rise behind him, sacred river Ganga reflects orange sunset, flower petals drift through the air, devotees bow in foreground"

PART 3 — CAMERA MOVEMENT: Exact shot type and movement arc.
  Include: starting position → movement → ending position.
  BAD: "Wide shot"
  GOOD: "Camera begins at low ground angle looking up, slowly cranes upward and back to reveal the full divine figure against the vast temple sky"

PART 4 — LIGHTING & ATMOSPHERE: Specific light quality, color palette, volumetric effects.
  BAD: "Dramatic lighting"
  GOOD: "Golden hour warm amber light from the right, volumetric god rays piercing through pillars, deep purple and orange sky gradient, sacred fire glow casting shadows on stone"

EXAMPLE COMPLETE PROMPT (mythology scene):
"Lord Shiva sits in cross-legged meditation on a flat rock atop Mount Kailash, ash-white skin with blue throat, crescent moon nestled in matted locks, third eye faintly glowing amber, draped in tiger skin with serpent coiled at wrist. Snow-capped Himalayan peaks extend endlessly under a pre-dawn indigo sky blazing with stars and the Milky Way galaxy; a small sacred fire burns in the foreground. The camera starts at ground level behind the flame and slowly cranes upward in a majestic arc, revealing the full divine silhouette against the cosmos. Deep blue and silver moonlight dominates, with soft warm fire glow creating contrast in the foreground; subtle aurora-like divine energy pulses around the figure."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "hook": "Opening 3-second hook narration — must grab attention immediately",
  "fullScript": "Complete narration script with all scene dialogues/VO from start to finish",
  "narrationDraft": "Natural, conversational speaking version of the full narration",
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
      "visualGuidance": "Art direction: dominant colors, mood, key visual elements that define this scene's look",
      "prompt": "FULL 3-5 SENTENCE KLING PROMPT following the 4-part structure above — subject+action, environment, camera movement, lighting+atmosphere"
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

CRITICAL: Every single "prompt" field must follow the 4-part structure. No one-liners. No vague descriptions. Minimum 3 full sentences.`;

    const rawContent = await generateWithModel(model, systemPrompt, userPrompt, 8192);

    let scriptData: {
      hook: string;
      fullScript: string;
      narrationDraft: string;
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
        data: { status: 'ScriptGenerated' },
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

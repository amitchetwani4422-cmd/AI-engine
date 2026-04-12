export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { generateWithModel, DEFAULT_SCRIPT_MODEL } from "@/lib/ai-provider";
import type { AIModel } from "@/lib/ai-provider";

const Schema = z.object({
  rawScript: z.string().min(10, "Script is too short"),
  channelId: z.string().min(1),
  title: z.string().optional(),
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
  promptEn?: string | null;
  narrationText?: string | null;
  dialogues?: { character: string; text: string }[] | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = Schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { rawScript, channelId, title, formatVariant, aiModel } = parsed.data;
    const model = (aiModel ?? DEFAULT_SCRIPT_MODEL) as AIModel;

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: { styleBible: true },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const styleGuide = channel.styleBible
      ? `Visual Style: ${channel.visualStyle}
Lighting: ${channel.styleBible.lightingPreferences}
Camera Feel: ${channel.styleBible.cameraFeel}
Music Direction: ${channel.styleBible.musicDirection}
Narration Tone: ${channel.styleBible.narrationTone}`
      : `Visual Style: ${channel.visualStyle}
Voice Style: ${channel.voiceStyle}`;

    const derivedTitle = title?.trim() ||
      rawScript.split(/\n/)[0].replace(/^[#*\->\s]+/, "").slice(0, 80).trim() ||
      "Custom Reel";

    const systemPrompt = `You are a professional AI video director specializing in short-form video content for YouTube Reels and Shorts.
Your job is to convert a user-written script into a production-ready scene-by-scene video breakdown with cinematic AI video prompts.
A great Kling prompt is 3-5 specific sentences covering: subject+action, environment/setting, camera movement, and lighting/atmosphere.
Always respond with valid JSON only, no markdown, no commentary.`;

    const userPrompt = `Convert the following script into a complete video production breakdown.

CHANNEL: ${channel.name}
PLATFORM: ${channel.primaryPlatform}
NICHE: ${channel.niche}
LANGUAGE: ${channel.language}
FORMAT: ${formatVariant ?? "Reel"}

CHANNEL STYLE GUIDE:
${styleGuide}

USER'S SCRIPT:
"""
${rawScript}
"""

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Read the user's script carefully. Your job is to:
1. Preserve the script's story, dialogue, and message exactly — do NOT change or add content
2. Break the script into 6–12 visual scenes that can be rendered as short video clips
3. Write a cinematic AI video prompt for each scene
4. Extract the narration text and any character dialogues per scene from the script

STEP 1 — DEFINE THE WORLD SETTING
Define a "worldSetting" — a single paragraph (4-6 sentences) describing the visual world all scenes share.
Cover: time period, location type, architectural/environmental style, recurring visual elements, color palette (2-3 dominant colors), atmosphere/lighting, one signature visual detail repeated across scenes.

STEP 2 — SCENE BREAKDOWN RULES
- Each scene = one continuous video clip (5 or 10 seconds)
- Use 5s for dialogue/close-up/reaction shots; 10s for wide establishing or epic reveals
- Scene descriptions should state the narrative purpose (what story beat this serves)
- narrationText: the narrator/VO lines spoken during this scene (copy from script, can be empty)
- dialogues: character lines spoken during this scene as [{character, text}] (copy from script, can be empty array)

STEP 3 — VISUAL PROMPT RULES (the "prompt" field)
Each scene's "prompt" goes directly to the Kling AI video model. Follow this 4-part structure:

PART 1 — SUBJECT & ACTION: Who/what is in frame + what they are doing. Include appearance, clothing, expression.
PART 2 — 3-LAYER ENVIRONMENT: Foreground atmospheric element + midground character space + background architecture/nature (must reference worldSetting)
PART 3 — CAMERA MOVEMENT: Starting position → movement → ending position (e.g. "Low-angle push-in from knee level rising to medium shot")
PART 4 — LIGHTING & ATMOSPHERE: Light quality, color palette, volumetric effects (must match worldSetting palette)

Minimum 3 sentences. No vague words like "epic" alone. Be specific.

ALSO provide "promptEn" — an English-language version of the same prompt (useful for LTX/Wan models).

MODEL ROUTING:
- "kling-3.0": character close-ups, dialogue moments, emotional beats, action shots
- "ltx-video-2": wide establishing shots, landscapes, scenic backgrounds (no characters)
- "wan-2.1": mid-shots, exterior environment shots, moderate movement
- "veo-3.1": ONLY if real lip-sync audio is needed (max 1 scene)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE FORMAT (valid JSON only)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "hook": "Opening 3-second hook line",
  "fullScript": "The user's full script (clean, formatted version)",
  "narrationDraft": "Natural speaking version",
  "worldSetting": "4-6 sentences defining the visual world",
  "titleOptions": ["Title 1", "Title 2", "Title 3"],
  "thumbnailConcepts": ["Thumbnail 1 description", "Thumbnail 2 description"],
  "musicMood": "Music description e.g. 'Soft devotional sitar with building orchestral swell'",
  "scenes": [
    {
      "sequenceNumber": 1,
      "description": "Narrative purpose of this scene",
      "duration": 5,
      "modelAssigned": "kling-3.0",
      "routingReason": "Why this model",
      "cameraDirection": "Specific shot type + movement",
      "visualGuidance": "Colors, mood, depth layers",
      "narrationText": "Narrator VO for this scene (from script, or empty string)",
      "dialogues": [{"character": "Ram", "text": "Dialogue line"}],
      "prompt": "FULL 3-5 SENTENCE KLING PROMPT — 4 parts as described",
      "promptEn": "Same prompt in English"
    }
  ]
}`;

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
      const jsonStr = rawContent.trim().replace(/^```json\n?|\n?```$/g, "");
      scriptData = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { error: "AI failed to return valid JSON. Try again.", raw: rawContent.slice(0, 500) },
        { status: 500 }
      );
    }

    const script = await prisma.$transaction(async (tx) => {
      const newScript = await tx.script.create({
        data: {
          channelId,
          ideaId: null,
          title: scriptData.titleOptions?.[0] ?? derivedTitle,
          formatVariant: formatVariant ?? "Reel",
          hook: scriptData.hook ?? "",
          fullScript: scriptData.fullScript ?? rawScript,
          narrationDraft: scriptData.narrationDraft ?? null,
          description: scriptData.worldSetting ?? null,
          titleOptions: scriptData.titleOptions ?? [derivedTitle],
          thumbnailConcepts: scriptData.thumbnailConcepts ?? [],
          musicMood: scriptData.musicMood ?? "",
          status: "Draft",
        },
      });

      if (scriptData.scenes?.length > 0) {
        await tx.scene.createMany({
          data: scriptData.scenes.map((scene) => ({
            scriptId: newScript.id,
            sequenceNumber: scene.sequenceNumber,
            description: scene.description,
            duration: scene.duration,
            modelAssigned: scene.modelAssigned ?? "kling-3.0",
            routingReason: scene.routingReason ?? "",
            cameraDirection: scene.cameraDirection ?? "",
            visualGuidance: scene.visualGuidance ?? "",
            prompt: scene.prompt ?? null,
            promptEn: scene.promptEn ?? null,
            narrationText: scene.narrationText ?? null,
            dialogues: scene.dialogues ?? [],
            characterIds: [],
          })),
        });
      }

      return newScript;
    });

    const full = await prisma.script.findUnique({
      where: { id: script.id },
      include: {
        sceneBreakdown: { orderBy: { sequenceNumber: "asc" } },
        channel: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(full, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("POST /api/scripts/generate-from-text error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

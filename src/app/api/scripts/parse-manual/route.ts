export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { generateWithModel, DEFAULT_SCRIPT_MODEL } from "@/lib/ai-provider";
import type { AIModel } from "@/lib/ai-provider";

const Schema = z.object({
  title: z.string().min(1),
  channelId: z.string().min(1),
  fullScript: z.string().min(10),
  hook: z.string().optional(),
  formatVariant: z.string().optional(),
  musicMood: z.string().optional(),
  aiModel: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const { title, channelId, fullScript, hook, formatVariant, musicMood, aiModel } = parsed.data;
    const model = (aiModel ?? DEFAULT_SCRIPT_MODEL) as AIModel;

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: { styleBible: true },
    });
    if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

    const styleGuide = channel.styleBible
      ? `Lighting: ${channel.styleBible.lightingPreferences}\nCamera Feel: ${channel.styleBible.cameraFeel}\nMusic Direction: ${channel.styleBible.musicDirection}`
      : `Visual Style: ${channel.visualStyle}\nVoice Style: ${channel.voiceStyle}`;

    const systemPrompt = `You are an AI video director. You receive a human-written narration/script and break it into production-ready scene cards for AI video generation (Kling, Minimax, LTX Video).
Each scene must have a complete FAL/Kling video generation prompt.
Always respond with valid JSON only — no markdown, no commentary.`;

    const userPrompt = `Break this script into a scene-by-scene video production breakdown.

CHANNEL: ${channel.name}
NICHE: ${channel.niche}
LANGUAGE: ${channel.language}
PLATFORM: ${channel.primaryPlatform}
FORMAT: ${formatVariant ?? "Standard"}

STYLE GUIDE:
${styleGuide}

SCRIPT TITLE: ${title}
${hook ? `HOOK: ${hook}` : ""}

FULL SCRIPT / NARRATION:
${fullScript}

━━━━━━━━━━━━━━━━━━━━
INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━
1. Identify 6–12 natural visual moments in the script. Each moment where the visual setting, action, or emotion shifts = a new scene.
2. For each scene assign narrationText = the exact lines from the script spoken during that scene (copy directly from the script, do NOT paraphrase).
3. Write a complete FAL video generation prompt for each scene (3-5 sentences: subject+action, 3-layer environment, camera movement, lighting).
4. Assign the best model per scene:
   - "kling-3.0" → human character actions, cooking, stirring, motion
   - "kling-2.1" → character in a known kitchen/location (when reference image exists)
   - "minimax"   → dramatic, cinematic, story/flashback scenes
   - "ltx-video-2" → food B-roll, texture shots, steam/pour closeups
   - "sync-lipsync" → direct-to-camera host dialogue (1-2 max)

WORLDSETTING: Write a single paragraph describing the visual world all scenes share (architecture, palette, atmosphere, signature detail).

RESPONSE FORMAT:
{
  "hook": "opening 1-2 sentences that grab attention immediately",
  "narrationDraft": "the full script as-is (copy verbatim)",
  "worldSetting": "visual world paragraph for background consistency",
  "musicMood": "specific music description e.g. 'Warm Rajasthani folk with sitar, gentle tabla'",
  "titleOptions": ["Title 1", "Title 2", "Title 3"],
  "thumbnailConcepts": ["Thumbnail concept 1", "Thumbnail concept 2"],
  "scenes": [
    {
      "sequenceNumber": 1,
      "description": "What story beat / emotion this scene serves",
      "narrationText": "Exact script lines spoken during this scene",
      "duration": 5,
      "modelAssigned": "kling-3.0",
      "routingReason": "Human motion — cooking action",
      "cameraDirection": "Low-angle push-in from counter level rising to medium shot",
      "visualGuidance": "Warm golden light, close-up on hands, steam rising",
      "prompt": "Full 3-5 sentence FAL video generation prompt here"
    }
  ]
}`;

    const raw = await generateWithModel(model, systemPrompt, userPrompt, 6000);
    let aiData: {
      hook?: string;
      narrationDraft?: string;
      worldSetting?: string;
      musicMood?: string;
      titleOptions?: string[];
      thumbnailConcepts?: string[];
      scenes: Array<{
        sequenceNumber: number;
        description: string;
        narrationText?: string;
        duration: number;
        modelAssigned: string;
        routingReason: string;
        cameraDirection: string;
        visualGuidance: string;
        prompt?: string;
      }>;
    };

    try {
      const jsonStr = raw.trim().replace(/^```json\n?|\n?```$/g, "");
      aiData = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response", raw }, { status: 500 });
    }

    const script = await prisma.$transaction(async (tx) => {
      const newScript = await tx.script.create({
        data: {
          channelId,
          title,
          formatVariant: formatVariant ?? "Manual",
          hook: hook || aiData.hook || title,
          fullScript,
          narrationDraft: aiData.narrationDraft ?? fullScript,
          description: aiData.worldSetting ?? null,
          musicMood: musicMood || aiData.musicMood || "To be determined",
          titleOptions: aiData.titleOptions ?? [title],
          thumbnailConcepts: aiData.thumbnailConcepts ?? [],
          status: "Draft",
        },
      });

      if (aiData.scenes?.length > 0) {
        await tx.scene.createMany({
          data: aiData.scenes.map((s) => ({
            scriptId: newScript.id,
            sequenceNumber: s.sequenceNumber,
            description: s.description,
            narrationText: s.narrationText ?? null,
            duration: s.duration,
            modelAssigned: s.modelAssigned,
            routingReason: s.routingReason,
            cameraDirection: s.cameraDirection,
            visualGuidance: s.visualGuidance,
            prompt: s.prompt ?? null,
            characterIds: [],
          })),
        });
      }

      return newScript;
    });

    return NextResponse.json({ id: script.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

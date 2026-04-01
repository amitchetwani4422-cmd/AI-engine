export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import Anthropic from "@anthropic-ai/sdk";
import prisma from '@/lib/prisma';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const GenerateScriptSchema = z.object({
  ideaId: z.string().min(1),
  channelId: z.string().min(1),
  formatVariant: z.string().optional(),
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

    const { ideaId, channelId, formatVariant } = parsed.data;

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

    const systemPrompt = `You are a professional video scriptwriter and creative director for AI-generated content.
Create detailed, production-ready scripts with precise scene-by-scene breakdowns optimized for AI video generation.
Always respond with valid JSON only, no markdown, no commentary.`;

    const userPrompt = `Create a complete script and creative pack for this video idea:

Channel: ${channel.name}
Platform: ${channel.primaryPlatform}
Niche: ${channel.niche}
Language: ${channel.language}
Format Variant: ${formatVariant ?? 'Standard'}

Idea Title: ${idea.title}
Idea Description: ${idea.description}
Tags: ${idea.tags.join(', ')}

Style Guide:
${styleGuide}

Generate a complete JSON response with this exact structure:
{
  "hook": "Opening 3-second hook narration",
  "fullScript": "Complete narration script from start to finish",
  "narrationDraft": "Natural speaking version of the full narration",
  "titleOptions": ["Title Option 1", "Title Option 2", "Title Option 3"],
  "thumbnailConcepts": [
    "Thumbnail concept 1: describe composition, text overlay, visual elements",
    "Thumbnail concept 2: describe alternative concept"
  ],
  "musicMood": "Upbeat electronic / Emotional orchestral / etc.",
  "scenes": [
    {
      "sequenceNumber": 1,
      "description": "What happens in this scene",
      "duration": 5,
      "modelAssigned": "kling-3.0",
      "routingReason": "Action scene with movement requires Kling",
      "cameraDirection": "Wide establishing shot, slow pan right",
      "visualGuidance": "Detailed visual description for this scene",
      "prompt": "Detailed AI video generation prompt for this scene"
    }
  ]
}

Model routing rules:
- Use "kling-3.0" for character-driven scenes, action, movement, creatures (80% of scenes)
- Use "veo-3.1" for lip-sync, narration, devotional close-ups (20% of scenes)

Ensure scenes cover approximately 60 seconds total duration.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const rawContent = message.content[0].type === 'text' ? message.content[0].text : '';

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
    console.error('POST /api/scripts/generate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate script' },
      { status: 500 }
    );
  }
}

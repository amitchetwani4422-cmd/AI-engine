import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import anthropic from '@/lib/anthropic';

const GenerateScriptSchema = z.object({
  ideaId: z.string().min(1),
  channelId: z.string().min(1),
  formatVariant: z.string().optional(),
});

interface SceneData {
  sceneNumber: number;
  description: string;
  narration: string;
  visualPrompt: string;
  modelRouting: string;
  durationSeconds: number;
  characterId?: string | null;
  transitionType?: string | null;
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
        include: {
          styleBible: true,
          characters: { take: 5 },
        },
      }),
    ]);

    if (!idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const styleGuide = channel.styleBible
      ? `Visual Style: ${(channel.styleBible as Record<string, unknown>).visualStyle ?? 'Cinematic'}
Tone: ${(channel.styleBible as Record<string, unknown>).tone ?? 'Engaging'}
Color Palette: ${(channel.styleBible as Record<string, unknown>).colorPalette ?? 'Vibrant'}`
      : 'Style: Cinematic, engaging, platform-optimized';

    const charactersInfo =
      channel.characters.length > 0
        ? channel.characters.map((c) => `- ${c.name}: ${c.description ?? ''}`).join('\n')
        : 'No recurring characters defined';

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
Idea Description: ${idea.description ?? 'Not provided'}
Hook: ${idea.hook ?? 'Create a compelling hook'}
Target Emotion: ${idea.targetEmotion ?? 'Engagement'}
Estimated Duration: ${idea.estimatedDuration ?? 60} seconds

Style Guide:
${styleGuide}

Characters Available:
${charactersInfo}

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
      "sceneNumber": 1,
      "description": "What happens in this scene",
      "narration": "Exact words spoken during this scene",
      "visualPrompt": "Detailed AI image/video generation prompt for this scene",
      "modelRouting": "kling|veo|runway|stable-diffusion",
      "durationSeconds": 5,
      "transitionType": "cut|fade|dissolve"
    }
  ]
}

Model routing rules:
- Use "kling" for character-driven scenes, action, movement
- Use "veo" for landscapes, environments, atmospheric scenes
- Use "runway" for stylized/artistic scenes
- Use "stable-diffusion" for still image backgrounds

Ensure scenes cover the full estimated duration of ${idea.estimatedDuration ?? 60} seconds total.`;

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const rawContent =
      message.content[0].type === 'text' ? message.content[0].text : '';

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
          formatVariant: formatVariant ?? null,
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
            sceneNumber: scene.sceneNumber,
            description: scene.description,
            narration: scene.narration,
            visualPrompt: scene.visualPrompt,
            modelRouting: scene.modelRouting,
            durationSeconds: scene.durationSeconds,
            transitionType: scene.transitionType ?? null,
            characterId: scene.characterId ?? null,
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
        scenes: { orderBy: { sceneNumber: 'asc' } },
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

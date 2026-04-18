export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateWithModel, DEFAULT_SCRIPT_MODEL } from "@/lib/ai-provider";
import type { AIModel } from "@/lib/ai-provider";

export interface VoiceScriptLine {
  lineNumber: string;
  timestamp: string;
  sceneName: string;
  voiceDirection: string;
  scriptText: string;
  elevenLabsSettings: {
    stability: number;
    similarityBoost: number;
    style: number;
    speakerBoost: boolean;
  };
}

export interface VoiceScriptOutput {
  episodeTitle: string;
  language: string;
  voiceDescription: string;
  platform: string;
  totalDurationMins: string;
  defaultSettings: {
    stability: number;
    similarityBoost: number;
    style: number;
    speakerBoost: boolean;
    model: string;
  };
  lines: VoiceScriptLine[];
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({})) as { aiModel?: string };

    const script = await prisma.script.findUnique({
      where: { id },
      include: {
        sceneBreakdown: { orderBy: { sequenceNumber: "asc" } },
        channel: true,
      },
    });

    if (!script) return NextResponse.json({ error: "Script not found" }, { status: 404 });

    const model = (body.aiModel ?? DEFAULT_SCRIPT_MODEL) as AIModel;

    type SceneRow = { sequenceNumber: number; duration: number; description: string; cameraDirection: string | null; narrationText: string | null };
    const scenes = script.sceneBreakdown as SceneRow[];

    // Build cumulative timestamps from scene durations
    let cumulative = 0;
    const sceneTimestamps = scenes.map((scene) => {
      const start = cumulative;
      cumulative += scene.duration;
      return { start, end: cumulative };
    });
    const totalSecs = cumulative;
    const totalMins = Math.floor(totalSecs / 60);
    const totalRemSecs = totalSecs % 60;

    const scenesContext = scenes
      .map((scene: SceneRow, i: number) => {
        const ts = sceneTimestamps[i];
        return [
          `Scene ${scene.sequenceNumber} [${formatTimestamp(ts.start)} – ${formatTimestamp(ts.end)}] (${scene.duration}s)`,
          `  Purpose: ${scene.description}`,
          scene.cameraDirection ? `  Camera: ${scene.cameraDirection}` : null,
          scene.narrationText ? `  Narration: ${scene.narrationText}` : null,
        ]
          .filter(Boolean)
          .join("\n");
      })
      .join("\n\n");

    const systemPrompt = `You are a professional voice direction writer and audio producer specialising in ElevenLabs TTS for Indian storytelling content.
You write precise, actionable per-line voice direction notes that guide tone, pacing, and emotion for a narrator.
Always respond with valid JSON only — no markdown, no commentary.`;

    const userPrompt = `Generate a complete ElevenLabs voice script (DOCUMENT 2 format) for this video.

CHANNEL: ${script.channel.name}
NICHE: ${script.channel.niche}
LANGUAGE: ${script.channel.language}
VOICE STYLE: ${script.channel.voiceStyle}
EPISODE TITLE: ${script.title}
TOTAL DURATION: ${totalMins}m ${totalRemSecs}s

FULL NARRATION (source text):
${script.narrationDraft ?? script.fullScript}

SCENE BREAKDOWN:
${scenesContext}

━━━━━━━━━━━━━━━━━━━━
INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━
Produce one or more lines per scene. For scenes with multiple emotional beats, split into sub-lines (3A, 3B etc.).

For each line provide:
1. lineNumber — "01", "02"... (2-digit zero-padded, increment continuously)
2. timestamp — "M:SS – M:SS" matching the scene window (split proportionally for sub-lines)
3. sceneName — "HOOK" for line 1, then "SCENE 2", "SCENE 3A", "SCENE 3B", "SCENE 4" etc.
4. scriptText — exact narration text in ${script.channel.language} for this line (Roman script for Hindi). Distribute the full narration across lines proportionally. Do NOT skip any narration.
5. voiceDirection — 2–3 short sentences of editorial direction, specific to the content of THIS line. Examples:
   - "Calm, storytelling mode. Like telling a story to a child. Warm and unhurried."
   - "Short. Punchy. Let this line breathe. Pause before and after."
   - "Energy rises here. Excitement in voice. This is the wow moment."
   - "Tender. Almost reverent. This is the emotional core."
   Always reference specific words or phrases from the scriptText.
6. elevenLabsSettings — per-line 11Labs settings based on emotional register:
   | Mood                        | stability | similarityBoost | style |
   |-----------------------------|-----------|-----------------|-------|
   | Hook / mystery / intrigue   | 0.45      | 0.80            | 0.35  |
   | Calm storytelling           | 0.65      | 0.75            | 0.20  |
   | Emotional / tender          | 0.70      | 0.80            | 0.30  |
   | Punchy / dramatic short     | 0.40      | 0.85            | 0.45  |
   | Awe / wonder / revelation   | 0.55      | 0.80            | 0.35  |
   | Conflict / heavy / dark     | 0.60      | 0.78            | 0.38  |
   | Energy / excitement         | 0.35      | 0.85            | 0.55  |
   | Call to action              | 0.30      | 0.88            | 0.60  |
   speakerBoost is always true.

RESPONSE FORMAT (JSON only):
{
  "voiceDescription": "describe the voice in 4-6 words, e.g. 'Warm Indian Female 25-30 yrs'",
  "defaultSettings": {
    "stability": 0.45,
    "similarityBoost": 0.80,
    "style": 0.35,
    "speakerBoost": true,
    "model": "eleven_multilingual_v2"
  },
  "lines": [
    {
      "lineNumber": "01",
      "timestamp": "0:00 – 0:10",
      "sceneName": "HOOK",
      "voiceDirection": "...",
      "scriptText": "...",
      "elevenLabsSettings": {
        "stability": 0.45,
        "similarityBoost": 0.80,
        "style": 0.35,
        "speakerBoost": true
      }
    }
  ]
}`;

    const raw = await generateWithModel(model, systemPrompt, userPrompt, 4096);

    let aiOutput: {
      voiceDescription: string;
      defaultSettings: VoiceScriptOutput["defaultSettings"];
      lines: VoiceScriptLine[];
    };

    try {
      const jsonStr = raw.trim().replace(/^```json\n?|\n?```$/g, "");
      aiOutput = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response", raw }, { status: 500 });
    }

    const result: VoiceScriptOutput = {
      episodeTitle: script.title,
      language: script.channel.language,
      voiceDescription: aiOutput.voiceDescription,
      platform: "ElevenLabs",
      totalDurationMins: `~${totalMins}:${totalRemSecs.toString().padStart(2, "0")} mins`,
      defaultSettings: aiOutput.defaultSettings,
      lines: aiOutput.lines,
    };

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

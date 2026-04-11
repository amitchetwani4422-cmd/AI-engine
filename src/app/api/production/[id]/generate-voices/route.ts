export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

async function generateAudio(elevenlabsVoiceId: string, text: string, apiKey: string): Promise<string> {
  const res = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${elevenlabsVoiceId}`, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs error ${res.status}: ${err}`);
  }
  const buf = await res.arrayBuffer();
  return `data:audio/mpeg;base64,${Buffer.from(buf).toString("base64")}`;
}

// POST /api/production/[id]/generate-voices
// Body: { voiceAssetId: string, sceneIds?: string[] }
// Generates ElevenLabs narration audio for each scene that has narrationText.
// Saves audio as scene.sceneAudio.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params;
    const body = await request.json().catch(() => ({}));
    const { voiceAssetId, sceneIds } = body as { voiceAssetId?: string; sceneIds?: string[] };

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "ELEVENLABS_API_KEY not configured" }, { status: 500 });

    // Get video + scenes
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        script: {
          include: {
            sceneBreakdown: { orderBy: { sequenceNumber: "asc" } },
          },
        },
      },
    });
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    // Resolve voice asset
    let voiceAsset = voiceAssetId
      ? await prisma.voiceAsset.findUnique({ where: { id: voiceAssetId } })
      : null;

    if (!voiceAsset) {
      // Try channel's narrator voice
      const channel = await prisma.channel.findUnique({ where: { id: video.channelId } });
      if (channel?.narratorVoiceId) {
        voiceAsset = await prisma.voiceAsset.findUnique({ where: { id: channel.narratorVoiceId } });
      }
    }

    if (!voiceAsset) {
      // Fall back to first available voice for this channel
      voiceAsset = await prisma.voiceAsset.findFirst({ where: { channelId: video.channelId } });
    }

    if (!voiceAsset) {
      return NextResponse.json({ error: "No voice asset found. Create a voice asset first from Voice & Audio." }, { status: 400 });
    }

    const allScenes = video.script?.sceneBreakdown ?? [];
    const targetScenes = sceneIds
      ? allScenes.filter((s) => sceneIds.includes(s.id))
      : allScenes;

    // Only process scenes that have narrationText (or description as fallback)
    const results: { sceneId: string; ok: boolean; error?: string }[] = [];

    for (const scene of targetScenes) {
      const text = (scene as Record<string, unknown>).narrationText as string | undefined
        ?? scene.description;

      if (!text?.trim()) {
        results.push({ sceneId: scene.id, ok: false, error: "No narration text" });
        continue;
      }

      try {
        const audioUrl = await generateAudio(voiceAsset.elevenlabsVoiceId, text.trim(), apiKey);

        await prisma.scene.update({ where: { id: scene.id }, data: { sceneAudio: audioUrl } });

        // Log to VoiceGeneration
        await prisma.voiceGeneration.create({
          data: {
            voiceAssetId: voiceAsset.id,
            sceneId: scene.id,
            videoId,
            text: text.trim(),
            audioUrl,
            status: "Generated",
          },
        });

        results.push({ sceneId: scene.id, ok: true });
      } catch (err) {
        results.push({ sceneId: scene.id, ok: false, error: String(err) });
      }
    }

    const generated = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok).length;

    return NextResponse.json({ ok: true, generated, failed, voiceAssetId: voiceAsset.id, voiceName: voiceAsset.name, results });
  } catch (error) {
    console.error("[generate-voices]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

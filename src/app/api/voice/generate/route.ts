export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voiceAssetId, emotion = "neutral", stability = 0.5, similarityBoost = 0.75, style = 0, sceneId, videoId } = body as Record<string, unknown>;

    if (!text || !voiceAssetId) {
      return NextResponse.json({ error: "text and voiceAssetId are required" }, { status: 400 });
    }

    const voiceAsset = await prisma.voiceAsset.findUnique({ where: { id: voiceAssetId as string } });
    if (!voiceAsset) return NextResponse.json({ error: "Voice asset not found" }, { status: 404 });

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "ELEVENLABS_API_KEY not configured" }, { status: 500 });

    const elevenLabsResponse = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceAsset.elevenlabsVoiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: text as string,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: stability as number,
            similarity_boost: similarityBoost as number,
            style: style as number,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      return NextResponse.json({ error: "ElevenLabs generation failed", details: errorText }, { status: elevenLabsResponse.status });
    }

    const audioBuffer = await elevenLabsResponse.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");
    const audioDataUrl = `data:audio/mpeg;base64,${audioBase64}`;

    const record = await prisma.voiceGeneration.create({
      data: {
        voiceAssetId: voiceAssetId as string,
        sceneId: (sceneId as string) ?? null,
        videoId: (videoId as string) ?? null,
        text: text as string,
        emotion: (emotion as string) ?? "neutral",
        audioUrl: audioDataUrl,
        status: "Generated",
      },
    });

    return NextResponse.json({ id: record.id, audioUrl: audioDataUrl, voiceAssetId, emotion, status: "Generated" }, { status: 201 });
  } catch (error) {
    console.error("POST /api/voice/generate error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

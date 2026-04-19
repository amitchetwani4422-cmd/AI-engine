export const dynamic = "force-dynamic";
export const maxDuration = 120;
/**
 * POST /api/production/[id]/generate-voices
 *
 * Generates ElevenLabs narration audio for each scene that has narrationText.
 * Uploads audio to Cloudinary and saves the URL in scene.sceneAudio.
 *
 * Body: { voiceAssetId?: string, sceneIds?: string[] }
 * - voiceAssetId: if omitted, uses the first voice asset linked to the channel
 * - sceneIds: if omitted, processes all scenes with narrationText
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

async function generateAndUploadAudio(
  text: string,
  elevenLabsVoiceId: string,
  apiKey: string,
  publicIdPrefix: string
): Promise<{ url: string; publicId: string } | null> {
  // Generate audio from ElevenLabs
  const response = await fetch(
    `${ELEVENLABS_API_URL}/text-to-speech/${elevenLabsVoiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ElevenLabs error: ${err.slice(0, 200)}`);
  }

  const audioBuffer = await response.arrayBuffer();

  // Upload to Cloudinary as a raw audio file
  const base64 = Buffer.from(audioBuffer).toString("base64");
  const dataUri = `data:audio/mpeg;base64,${base64}`;

  const upload = await cloudinary.uploader.upload(dataUri, {
    resource_type: "video", // Cloudinary uses "video" resource_type for audio
    folder: "ai-engine/audio",
    public_id: publicIdPrefix,
    overwrite: true,
  });

  return { url: upload.secure_url, publicId: upload.public_id };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params;
    const body = await request.json() as { voiceAssetId?: string; sceneIds?: string[] };

    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: {
        id: true,
        channelId: true,
        script: {
          select: {
            sceneBreakdown: {
              orderBy: { sequenceNumber: "asc" },
              select: {
                id: true,
                sequenceNumber: true,
                narrationText: true,
                sceneAudio: true,
              },
            },
          },
        },
      },
    });

    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "ELEVENLABS_API_KEY not configured" }, { status: 500 });

    // Resolve voice asset
    let voiceAsset: { id: string; name: string; externalVoiceId: string } | null = null;
    if (body.voiceAssetId) {
      voiceAsset = await prisma.voiceAsset.findUnique({
        where: { id: body.voiceAssetId },
        select: { id: true, name: true, externalVoiceId: true },
      });
    }
    if (!voiceAsset) {
      voiceAsset = await prisma.voiceAsset.findFirst({
        where: { channelId: video.channelId },
        select: { id: true, name: true, externalVoiceId: true },
        orderBy: { createdAt: "asc" },
      });
    }
    if (!voiceAsset) {
      return NextResponse.json({
        error: "No voice asset found. Create one in Voice & Audio settings first.",
      }, { status: 400 });
    }

    // Filter scenes: only those with narrationText, optionally limited to sceneIds
    let scenes = (video.script?.sceneBreakdown ?? []).filter(
      (s) => s.narrationText?.trim()
    );
    if (body.sceneIds?.length) {
      const ids = new Set(body.sceneIds);
      scenes = scenes.filter((s) => ids.has(s.id));
    }

    if (scenes.length === 0) {
      return NextResponse.json({
        ok: true,
        generated: 0,
        totalDialogues: 0,
        narratorName: voiceAsset.name,
        message: "No scenes with narration text found.",
      });
    }

    // Generate audio sequentially (ElevenLabs rate limits)
    let generated = 0;
    const errors: string[] = [];

    for (const scene of scenes) {
      try {
        const result = await generateAndUploadAudio(
          scene.narrationText!,
          voiceAsset.externalVoiceId,
          apiKey,
          `scene-${scene.id}-audio`
        );
        if (result) {
          await prisma.scene.update({
            where: { id: scene.id },
            data: {
              sceneAudio: result.url,
              sceneAudioPublicId: result.publicId,
            },
          });
          generated++;
        }
      } catch (err) {
        errors.push(`Scene ${scene.sequenceNumber}: ${String(err).slice(0, 100)}`);
      }
    }

    return NextResponse.json({
      ok: true,
      generated,
      totalDialogues: generated,
      narratorName: voiceAsset.name,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

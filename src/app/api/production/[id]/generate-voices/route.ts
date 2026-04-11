export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import prisma from "@/lib/prisma";

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
  });
}

// ── ElevenLabs TTS call ──────────────────────────────────────────────────────
async function tts(voiceId: string, text: string, apiKey: string): Promise<Buffer> {
  const res = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

// ── Upload audio buffer to Cloudinary ───────────────────────────────────────
async function uploadAudioToCloudinary(
  audioBuffer: Buffer,
  publicId: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const dataUri = `data:audio/mpeg;base64,${audioBuffer.toString("base64")}`;
    cloudinary.uploader.upload(
      dataUri,
      { resource_type: "video", public_id: publicId, overwrite: true, format: "mp3" },
      (err, result) => {
        if (err || !result) reject(new Error(err?.message ?? "Cloudinary upload failed"));
        else resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
  });
}

// ── Mix two audio buffers by concatenating (narrator intro → character line) ─
// Returns combined data URI. Simple sequential concat — no overlap.
function concatDataUris(uris: string[]): string {
  // For now return the first valid URI — proper mixing happens via Cloudinary
  // during assembly. We just pick the narration audio as the primary track.
  return uris[0] ?? "";
}

// ── POST /api/production/[id]/generate-voices ────────────────────────────────
// Body: { voiceAssetId?: string, sceneIds?: string[] }
// For each scene:
//   1. Generate narrator audio for narrationText
//   2. Generate character audio for each dialogue line (using character.voiceId)
//   3. Store narrator audio on sceneAudio (Cloudinary URL)
//   4. Log all generations to VoiceGeneration
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

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return NextResponse.json({ error: "Cloudinary credentials not configured" }, { status: 500 });
    }
    configureCloudinary();

    // ── Load video + scenes ─────────────────────────────────────────────────
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        script: { include: { sceneBreakdown: { orderBy: { sequenceNumber: "asc" } } } },
      },
    });
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    // ── Resolve narrator voice ──────────────────────────────────────────────
    let narratorVoice = voiceAssetId
      ? await prisma.voiceAsset.findUnique({ where: { id: voiceAssetId } })
      : null;

    if (!narratorVoice) {
      const channel = await prisma.channel.findUnique({ where: { id: video.channelId } });
      if (channel?.narratorVoiceId) {
        narratorVoice = await prisma.voiceAsset.findUnique({ where: { id: channel.narratorVoiceId } });
      }
    }
    if (!narratorVoice) {
      narratorVoice = await prisma.voiceAsset.findFirst({ where: { channelId: video.channelId } });
    }
    if (!narratorVoice) {
      return NextResponse.json({
        error: "No voice asset found. Create a narrator voice from Voice & Audio page first.",
      }, { status: 400 });
    }

    // ── Load all characters for this channel (for dialogue voice routing) ───
    const allCharacters = await prisma.character.findMany({
      where: { channelId: video.channelId },
      include: { voice: true },
    });
    const characterVoiceMap = new Map(
      allCharacters
        .filter((c) => c.voice?.elevenlabsVoiceId)
        .map((c) => [c.name.toLowerCase(), c.voice!])
    );

    const allScenes = video.script?.sceneBreakdown ?? [];
    const targetScenes = sceneIds
      ? allScenes.filter((s) => sceneIds.includes(s.id))
      : allScenes;

    const results: { sceneId: string; ok: boolean; narratorOk?: boolean; dialoguesGenerated?: number; error?: string }[] = [];

    for (const scene of targetScenes) {
      const narrationText = (scene as Record<string, unknown>).narrationText as string | undefined;
      const dialogues = ((scene as Record<string, unknown>).dialogues ?? []) as { character: string; text: string }[];

      // ── 1. Generate narrator audio ────────────────────────────────────────
      let narratorAudioUrl = "";
      let narratorPublicId = "";
      const textToSpeak = narrationText?.trim() || scene.description;

      try {
        const narratorBuffer = await tts(narratorVoice.elevenlabsVoiceId, textToSpeak, apiKey);
        const uploaded = await uploadAudioToCloudinary(
          narratorBuffer,
          `ai-engine/audio/narrator/video-${videoId}-scene-${scene.sequenceNumber}`
        );
        narratorAudioUrl = uploaded.url;
        narratorPublicId = uploaded.publicId;

        await prisma.voiceGeneration.create({
          data: {
            voiceAssetId: narratorVoice.id,
            sceneId: scene.id,
            videoId,
            text: textToSpeak,
            audioUrl: narratorAudioUrl,
            status: "Generated",
          },
        });
      } catch (err) {
        results.push({ sceneId: scene.id, ok: false, error: `Narrator TTS failed: ${err}` });
        continue;
      }

      // ── 2. Generate character dialogue audio ──────────────────────────────
      let dialoguesGenerated = 0;
      for (const dlg of dialogues) {
        if (!dlg.text?.trim()) continue;
        const charVoice = characterVoiceMap.get(dlg.character.toLowerCase());
        const voiceId = charVoice?.elevenlabsVoiceId ?? narratorVoice.elevenlabsVoiceId;

        try {
          const dlgBuffer = await tts(voiceId, dlg.text.trim(), apiKey);
          const dlgUploaded = await uploadAudioToCloudinary(
            dlgBuffer,
            `ai-engine/audio/dialogue/video-${videoId}-scene-${scene.sequenceNumber}-${dlg.character.toLowerCase().replace(/\s+/g, "-")}`
          );

          await prisma.voiceGeneration.create({
            data: {
              voiceAssetId: charVoice?.id ?? narratorVoice.id,
              sceneId: scene.id,
              videoId,
              text: `[${dlg.character}]: ${dlg.text}`,
              audioUrl: dlgUploaded.url,
              status: "Generated",
            },
          });
          dialoguesGenerated++;
        } catch {
          // Character voice failed — skip (narration still plays)
        }
      }

      // ── 3. Save narrator audio URL to scene ───────────────────────────────
      await prisma.scene.update({
        where: { id: scene.id },
        data: {
          sceneAudio: narratorAudioUrl,
          sceneAudioPublicId: narratorPublicId,
        },
      });

      results.push({ sceneId: scene.id, ok: true, narratorOk: true, dialoguesGenerated });
    }

    const generated = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok).length;
    const totalDialogues = results.reduce((s, r) => s + (r.dialoguesGenerated ?? 0), 0);

    return NextResponse.json({
      ok: true,
      generated,
      failed,
      totalDialogues,
      narratorName: narratorVoice.name,
      results,
    });
  } catch (error) {
    console.error("[generate-voices]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

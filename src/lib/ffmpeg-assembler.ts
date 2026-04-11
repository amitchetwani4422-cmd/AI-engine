import { v2 as cloudinary } from "cloudinary";
import { selectMusicCategory } from "@/lib/music-library";

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      `Cloudinary credentials missing. Set: ` +
      `${!cloudName ? "CLOUDINARY_CLOUD_NAME " : ""}` +
      `${!apiKey ? "CLOUDINARY_API_KEY " : ""}` +
      `${!apiSecret ? "CLOUDINARY_API_SECRET" : ""}`
    );
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
}

export interface ClipInput {
  url: string;
  sequenceNumber: number;
  duration: number;
  audioPublicId?: string;  // Cloudinary public_id for narration audio (optional)
}

export interface AssemblyResult {
  finalVideoUrl: string;
  cloudinaryPublicId: string;
  totalDuration: number;
  clipsUsed: number;
  hasAudio: boolean;
  musicCategory?: string;
}

// ── Upload a video clip URL to Cloudinary ────────────────────────────────────
async function uploadClip(url: string, publicId: string): Promise<{ public_id: string; secure_url: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(url, { resource_type: "video", public_id: publicId, overwrite: true },
      (err, result) => {
        if (err || !result) reject(new Error(`Cloudinary upload failed: ${err?.message ?? "unknown"}`));
        else resolve({ public_id: result.public_id, secure_url: result.secure_url });
      }
    );
  });
}

// ── Upload a video clip with narration audio mixed in (eager transformation) ─
async function uploadClipWithAudio(
  videoUrl: string,
  audioPublicId: string,
  publicId: string
): Promise<{ public_id: string; secure_url: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      videoUrl,
      {
        resource_type: "video",
        public_id: publicId,
        overwrite: true,
        eager: [{
          transformation: [
            // Overlay narration audio on the video clip
            { overlay: { resource_type: "video", public_id: audioPublicId } },
            { flags: "layer_apply" },
          ],
          format: "mp4",
        }],
        eager_async: false, // wait for processing
      },
      (err, result) => {
        if (err || !result) {
          reject(new Error(`Cloudinary audio-video merge failed: ${err?.message ?? "unknown"}`));
          return;
        }
        // eager[0].secure_url = clip with audio baked in
        const eager = (result as Record<string, unknown>).eager as Array<{ secure_url: string }> | undefined;
        const url = eager?.[0]?.secure_url ?? result.secure_url;
        resolve({ public_id: result.public_id, secure_url: url });
      }
    );
  });
}

// ── Upload background music URL to Cloudinary (fetch + store) ────────────────
async function uploadMusicTrack(musicUrl: string, publicId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      musicUrl,
      { resource_type: "video", public_id: publicId, overwrite: true },
      (err, result) => {
        if (err || !result) reject(new Error(`Music upload failed: ${err?.message ?? "unknown"}`));
        else resolve(result.public_id);
      }
    );
  });
}

// ── Add background music to assembled video at low volume ────────────────────
async function addBackgroundMusic(
  videoUrl: string,
  musicPublicId: string,
  volume: number,
  outputPublicId: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      videoUrl,
      {
        resource_type: "video",
        public_id: outputPublicId,
        overwrite: true,
        eager: [{
          transformation: [
            // Loop music to fill video duration, then apply at low volume
            { overlay: { resource_type: "video", public_id: musicPublicId } },
            { effect: `volume:${volume}`, flags: "layer_apply" },
          ],
          format: "mp4",
        }],
        eager_async: false,
      },
      (err, result) => {
        if (err || !result) {
          reject(new Error(`Music overlay failed: ${err?.message ?? "unknown"}`));
          return;
        }
        const eager = (result as Record<string, unknown>).eager as Array<{ secure_url: string }> | undefined;
        resolve(eager?.[0]?.secure_url ?? result.secure_url);
      }
    );
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main assembly
// Strategy:
//   1. For each clip: if narration audio exists, merge it in (Cloudinary eager)
//   2. Concatenate all clips using Cloudinary splice
//   3. Overlay background music at low volume
// ─────────────────────────────────────────────────────────────────────────────
export async function assembleVideo(
  videoId: string,
  clips: ClipInput[],
  options?: { musicMood?: string }
): Promise<AssemblyResult> {
  if (clips.length === 0) throw new Error("No clips provided for assembly");
  configureCloudinary();

  const sorted = [...clips].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  const totalDuration = sorted.reduce((sum, c) => sum + c.duration, 0);
  const hasAudio = sorted.some((c) => !!c.audioPublicId);

  console.log(`[Assembly] ${sorted.length} clips, hasAudio=${hasAudio}`);

  // ── Step 1: Upload clips (with audio merged if available) ─────────────────
  const uploaded = await Promise.all(
    sorted.map(async (clip, i) => {
      const videoPublicId = `ai-engine/clips/video-${videoId}-clip-${String(i).padStart(3, "0")}`;
      const withAudioPublicId = `ai-engine/clips-voiced/video-${videoId}-clip-${String(i).padStart(3, "0")}`;

      if (clip.audioPublicId) {
        // Upload video with narration audio baked in
        console.log(`[Assembly] Clip ${i + 1}/${sorted.length}: merging narration audio...`);
        return uploadClipWithAudio(clip.url, clip.audioPublicId, withAudioPublicId);
      } else {
        // Video only
        return uploadClip(clip.url, videoPublicId);
      }
    })
  );

  console.log(`[Assembly] All clips uploaded. Concatenating...`);

  // ── Step 2: Concatenate via Cloudinary splice ─────────────────────────────
  const assembledPublicId = `ai-engine/assembled/video-${videoId}`;

  let assembledUrl: string;
  let assembledPublicIdFinal: string;

  if (uploaded.length === 1) {
    assembledUrl = uploaded[0].secure_url;
    assembledPublicIdFinal = uploaded[0].public_id;
  } else {
    const spliceTransformation = uploaded.slice(1).flatMap((clip) => {
      const overlayId = clip.public_id.replace(/\//g, ":");
      return [
        { flags: "splice", overlay: `video:${overlayId}` },
        { flags: "layer_apply" },
      ];
    });

    const assembled = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader.upload(
          uploaded[0].secure_url,
          {
            resource_type: "video",
            public_id: assembledPublicId,
            overwrite: true,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            eager: [{ transformation: spliceTransformation as any, format: "mp4" }],
            eager_async: false,
          },
          (err, result) => {
            if (err || !result) {
              reject(new Error(`Cloudinary assembly failed: ${err?.message ?? "unknown"}`));
              return;
            }
            const r = result as Record<string, unknown>;
            const eager = r.eager as Array<{ secure_url: string }> | undefined;
            resolve({ secure_url: eager?.[0]?.secure_url ?? result.secure_url, public_id: result.public_id });
          }
        );
      }
    );

    assembledUrl = assembled.secure_url;
    assembledPublicIdFinal = assembled.public_id;
  }

  console.log(`[Assembly] Concatenation done.`);

  // ── Step 3: Add background music (if configured) ──────────────────────────
  let finalUrl = assembledUrl;
  let musicCategory: string | undefined;

  if (options?.musicMood) {
    const track = selectMusicCategory(options.musicMood);
    musicCategory = track.category;

    if (track.url) {
      try {
        console.log(`[Assembly] Adding background music: ${track.name} (${track.volume}% vol)...`);

        // Upload the music track to Cloudinary (or reuse cached)
        const musicPublicId = track.cloudinaryPublicId || `ai-engine/music/${track.category}`;
        let resolvedMusicPublicId = musicPublicId;

        if (!track.cloudinaryPublicId) {
          // Upload from URL
          resolvedMusicPublicId = await uploadMusicTrack(track.url, musicPublicId);
        }

        const finalPublicId = `ai-engine/final/video-${videoId}`;
        finalUrl = await addBackgroundMusic(assembledUrl, resolvedMusicPublicId, track.volume, finalPublicId);
        assembledPublicIdFinal = finalPublicId;
        console.log(`[Assembly] Background music applied.`);
      } catch (err) {
        // Music is optional — don't fail assembly if music step errors
        console.warn(`[Assembly] Music overlay skipped: ${err}`);
      }
    } else {
      console.log(`[Assembly] No music URL configured for category "${track.category}" — skipping music.`);
    }
  }

  return {
    finalVideoUrl: finalUrl,
    cloudinaryPublicId: assembledPublicIdFinal,
    totalDuration,
    clipsUsed: sorted.length,
    hasAudio,
    musicCategory,
  };
}

import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { v2 as cloudinary } from "cloudinary";
import { writeFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import os from "os";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ClipInput {
  url: string;
  sequenceNumber: number;
  duration: number;
}

export interface AssemblyResult {
  finalVideoUrl: string;
  cloudinaryPublicId: string;
  totalDuration: number;
  clipsUsed: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Download a remote clip to a local temp file
// ─────────────────────────────────────────────────────────────────────────────

async function downloadClip(url: string, destPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download clip: ${url} (${res.status})`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buffer);
}

// ─────────────────────────────────────────────────────────────────────────────
// Build FFmpeg concat filter for N clips
// Handles video-only clips (no audio track from AI models)
// Outputs: re-encoded h264/aac MP4 for maximum compatibility
// ─────────────────────────────────────────────────────────────────────────────

function buildConcatCommand(
  inputPaths: string[],
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const cmd = ffmpeg();

    // Add each clip as an input
    inputPaths.forEach((p) => cmd.input(p));

    const n = inputPaths.length;

    // Build filter_complex:
    // - Scale all clips to 1920x1080 (handles size mismatches between Kling/Veo)
    // - Add silent audio track to each (AI clips are video-only)
    // - Concat all streams
    const scaleFilters = inputPaths
      .map((_, i) => `[${i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24[v${i}];aevalsrc=0:c=stereo:s=44100:d=1[a${i}_src];[a${i}_src]atrim=duration=5[a${i}]`)
      .join(";");

    // Actually let me use a simpler approach - just scale and concat video, add silence at end
    const videoScaleFilters = inputPaths
      .map((_, i) => `[${i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24[v${i}]`)
      .join(";");

    const concatInputs = inputPaths.map((_, i) => `[v${i}]`).join("");
    const filterComplex = `${videoScaleFilters};${concatInputs}concat=n=${n}:v=1:a=0[outv]`;

    cmd
      .complexFilter(filterComplex)
      .outputOptions([
        "-map [outv]",
        "-c:v libx264",
        "-crf 18",           // high quality
        "-preset fast",
        "-movflags +faststart", // web-optimized (plays before full download)
        "-pix_fmt yuv420p",    // maximum compatibility
        "-an",                 // no audio (voice/music added separately)
      ])
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(new Error(`FFmpeg error: ${err.message}`)))
      .run();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Upload assembled video to Cloudinary
// ─────────────────────────────────────────────────────────────────────────────

async function uploadToCloudinary(
  filePath: string,
  publicId: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      {
        resource_type: "video",
        public_id: publicId,
        folder: "ai-content-engine/assembled",
        overwrite: true,
        transformation: [{ quality: "auto" }],
      },
      (error, result) => {
        if (error || !result) {
          reject(new Error(`Cloudinary upload failed: ${error?.message}`));
        } else {
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      }
    );
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main assembly function
// ─────────────────────────────────────────────────────────────────────────────

export async function assembleVideo(
  videoId: string,
  clips: ClipInput[]
): Promise<AssemblyResult> {
  if (clips.length === 0) throw new Error("No clips provided for assembly");

  // Sort by sequence number
  const sorted = [...clips].sort((a, b) => a.sequenceNumber - b.sequenceNumber);

  // Create temp directory for this job
  const tmpDir = join(os.tmpdir(), `assembly-${videoId}`);
  if (!existsSync(tmpDir)) await mkdir(tmpDir, { recursive: true });

  const downloadedPaths: string[] = [];
  const outputPath = join(tmpDir, "final.mp4");

  try {
    // 1. Download all clips in parallel
    console.log(`[Assembly] Downloading ${sorted.length} clips...`);
    await Promise.all(
      sorted.map(async (clip, i) => {
        const destPath = join(tmpDir, `clip_${String(i).padStart(3, "0")}.mp4`);
        await downloadClip(clip.url, destPath);
        downloadedPaths.push(destPath);
      })
    );
    // Re-sort paths by index to maintain order
    downloadedPaths.sort();

    // 2. Single clip — just re-encode without concat
    if (downloadedPaths.length === 1) {
      await new Promise<void>((resolve, reject) => {
        ffmpeg(downloadedPaths[0])
          .outputOptions([
            "-c:v libx264", "-crf 18", "-preset fast",
            "-movflags +faststart", "-pix_fmt yuv420p", "-an",
          ])
          .output(outputPath)
          .on("end", () => resolve())
          .on("error", (err) => reject(new Error(`FFmpeg error: ${err.message}`)))
          .run();
      });
    } else {
      // 3. Concatenate all clips
      console.log(`[Assembly] Running FFmpeg concat on ${downloadedPaths.length} clips...`);
      await buildConcatCommand(downloadedPaths, outputPath);
    }

    // 4. Upload to Cloudinary
    console.log(`[Assembly] Uploading to Cloudinary...`);
    const publicId = `video-${videoId}-${Date.now()}`;
    const { url, publicId: cloudId } = await uploadToCloudinary(outputPath, publicId);

    const totalDuration = sorted.reduce((sum, c) => sum + c.duration, 0);

    console.log(`[Assembly] Done. URL: ${url}`);
    return {
      finalVideoUrl: url,
      cloudinaryPublicId: cloudId,
      totalDuration,
      clipsUsed: sorted.length,
    };
  } finally {
    // 5. Clean up temp files
    const toDelete = [...downloadedPaths, outputPath];
    await Promise.allSettled(toDelete.map((p) => unlink(p).catch(() => {})));
    await unlink(tmpDir).catch(() => {});
  }
}

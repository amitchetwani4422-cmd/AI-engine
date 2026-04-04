import { v2 as cloudinary } from "cloudinary";

// Lazy config — called at request time so env vars are guaranteed to be loaded
function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      `Cloudinary credentials missing. Set these in Vercel env vars: ` +
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
}

export interface AssemblyResult {
  finalVideoUrl: string;
  cloudinaryPublicId: string;
  totalDuration: number;
  clipsUsed: number;
}

// Upload a single clip URL to Cloudinary (Cloudinary fetches from FAL URL server-side)
async function uploadClipToCloudinary(
  url: string,
  publicId: string
): Promise<{ public_id: string; secure_url: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      url,
      {
        resource_type: "video",
        public_id: publicId,
        overwrite: true,
        // No transformation — just store the raw clip
      },
      (err, result) => {
        if (err || !result) reject(new Error(`Cloudinary upload failed: ${err?.message ?? "unknown"}`));
        else resolve({ public_id: result.public_id, secure_url: result.secure_url });
      }
    );
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main assembly — runs entirely on Cloudinary's servers, no local FFmpeg needed.
// Works on Vercel Hobby (no 60s timeout issue since we just make API calls).
//
// Strategy:
//   1. Upload each clip to Cloudinary (Cloudinary fetches from FAL URL)
//   2. Build a Cloudinary splice-transformation URL that concatenates them
//   3. Trigger eager processing so the URL is pre-rendered on Cloudinary CDN
// ─────────────────────────────────────────────────────────────────────────────

export async function assembleVideo(
  videoId: string,
  clips: ClipInput[]
): Promise<AssemblyResult> {
  if (clips.length === 0) throw new Error("No clips provided for assembly");
  configureCloudinary(); // ensure env vars loaded at request time

  // Sort clips by sequence number
  const sorted = [...clips].sort((a, b) => a.sequenceNumber - b.sequenceNumber);

  console.log(`[Assembly] Uploading ${sorted.length} clips to Cloudinary...`);

  // 1. Upload all clips to Cloudinary in parallel
  //    Cloudinary fetches directly from FAL CDN URLs — no local download needed
  const uploaded = await Promise.all(
    sorted.map((clip, i) =>
      uploadClipToCloudinary(
        clip.url,
        `ai-engine/clips/video-${videoId}-clip-${String(i).padStart(3, "0")}`
      )
    )
  );

  console.log(`[Assembly] All clips uploaded. Building concatenation...`);

  const totalDuration = sorted.reduce((sum, c) => sum + c.duration, 0);
  const assembledPublicId = `ai-engine/assembled/video-${videoId}`;

  if (uploaded.length === 1) {
    // Single clip — just copy it as the final video
    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader.upload(
          uploaded[0].secure_url,
          {
            resource_type: "video",
            public_id: assembledPublicId,
            overwrite: true,
          },
          (err, res) => {
            if (err || !res) reject(new Error(err?.message ?? "Upload failed"));
            else resolve({ secure_url: res.secure_url, public_id: res.public_id });
          }
        );
      }
    );
    return {
      finalVideoUrl: result.secure_url,
      cloudinaryPublicId: result.public_id,
      totalDuration,
      clipsUsed: 1,
    };
  }

  // 2. Build Cloudinary splice transformation to concatenate all clips
  //    Cloudinary "splice" overlays append clips sequentially
  //    Format: fl_splice,l_video:{public_id}/fl_layer_apply repeating for each clip
  const spliceTransformation = uploaded
    .slice(1)
    .flatMap((clip) => {
      // Cloudinary public_id path separators must be : in overlay notation
      const overlayId = clip.public_id.replace(/\//g, ":");
      return [
        { flags: "splice", overlay: `video:${overlayId}` },
        { flags: "layer_apply" },
      ];
    });

  // 3. Upload base clip with eager splice transformation applied
  //    eager_async: false waits for Cloudinary to process it (usually 10-30s)
  console.log(`[Assembly] Running Cloudinary concat on ${sorted.length} clips...`);

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
          eager_async: false, // wait for it — usually 10-30s for 10 clips
        },
        (err, result) => {
          if (err || !result) {
            reject(new Error(`Cloudinary assembly failed: ${err?.message ?? "unknown"}`));
          } else {
            // eager[0].secure_url is the concatenated video
            const r = result as Record<string, unknown>;
            const eager = r.eager as Array<{ secure_url: string }> | undefined;
            const eagerUrl = eager?.[0]?.secure_url ?? result.secure_url;
            resolve({ secure_url: eagerUrl, public_id: result.public_id });
          }
        }
      );
    }
  );

  console.log(`[Assembly] Done. URL: ${assembled.secure_url}`);

  return {
    finalVideoUrl: assembled.secure_url,
    cloudinaryPublicId: assembled.public_id,
    totalDuration,
    clipsUsed: sorted.length,
  };
}

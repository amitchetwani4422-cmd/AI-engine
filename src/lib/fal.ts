import { fal } from "@fal-ai/client";
import { CHANNELS_CONFIG } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Client initialization
// ─────────────────────────────────────────────────────────────────────────────

fal.config({
  credentials: process.env.FAL_KEY ?? process.env.FAL_API_KEY,
});

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const COST_PER_SECOND: Record<string, number> = {
  "kling-3.0": 0.056, // Kling v1.6 Pro — ~$0.28/5s, no watermark
  "veo-3.1":   0.08,
};

const FAL_MODEL_IDS: Record<string, string> = {
  "kling-3.0": "fal-ai/kling-video/v1.6/pro/text-to-video",
  "veo-3.1":   "fal-ai/veo2",
};

// Quality keywords automatically appended to every prompt
const QUALITY_SUFFIX = ", cinematic 4K, ultra-detailed, razor-sharp focus, professional color grading, smooth motion, no watermark, no text overlays, no artifacts, no compression noise";

const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 2000;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type VideoModel = "kling-3.0" | "veo-3.1";

export interface VideoGenerationParams {
  model: VideoModel;
  prompt: string;
  duration: number;
  referenceImage?: string;
  audioUrl?: string;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  negativePrompt?: string;
}

export interface VideoGenerationResult {
  requestId: string;
  videoUrl: string;
  duration: number;
  cost: number;
  model: VideoModel;
}

export interface GenerationStatus {
  requestId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress?: number;
  videoUrl?: string;
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function estimateCost(model: VideoModel, durationSeconds: number): number {
  return parseFloat((COST_PER_SECOND[model] * durationSeconds).toFixed(4));
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────────────────────────────────────
// generateVideoScene
// ─────────────────────────────────────────────────────────────────────────────

export async function generateVideoScene(
  params: VideoGenerationParams,
  attempt = 1
): Promise<VideoGenerationResult> {
  const { model, prompt, duration, referenceImage, audioUrl, aspectRatio = "9:16", negativePrompt } = params;

  const falModelId = FAL_MODEL_IDS[model];

  // Build model-specific input payload
  let input: Record<string, unknown>;

  // Append quality suffix to all prompts
  const enhancedPrompt = prompt.endsWith(QUALITY_SUFFIX) ? prompt : prompt + QUALITY_SUFFIX;

  if (model === "kling-3.0") {
    const klingDuration = duration >= 8 ? "10" : "5";
    input = {
      prompt: enhancedPrompt,
      duration: klingDuration,
      aspect_ratio: aspectRatio,
      negative_prompt: negativePrompt ?? "watermark, logo, text overlay, subtitles, blurry, out of focus, low quality, compression artifacts, distorted faces, deformed hands, extra limbs, floating objects, camera shake, overexposed, washed out colors, ugly, worst quality, bad anatomy, mutation, duplicate subjects, stock footage look",
      ...(referenceImage && { image_url: referenceImage }),
    };
  } else {
    // veo-3.1
    input = {
      prompt: enhancedPrompt,
      aspect_ratio: aspectRatio,
      ...(negativePrompt && { negative_prompt: negativePrompt }),
    };
  }

  try {
    const result = await fal.subscribe(falModelId, {
      input,
      logs: false,
      onQueueUpdate: () => {
        // Queue updates can be used for progress tracking if needed
      },
    });

    // Extract video URL — Kling returns { video: { url } }, Veo2 returns { video_url } or { video: { url } }
    const output = result.data as {
      video?: { url: string };
      video_url?: string;
      videos?: Array<{ url: string }>;
    };

    const videoUrl =
      output?.video?.url ??
      output?.video_url ??
      output?.videos?.[0]?.url;

    if (!videoUrl) {
      throw new Error("No video URL returned from FAL.AI");
    }

    const cost = estimateCost(model, duration);

    return {
      requestId: result.requestId,
      videoUrl,
      duration,
      cost,
      model,
    };
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      const backoff = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      await sleep(backoff);
      return generateVideoScene(params, attempt + 1);
    }
    throw new Error(
      `Failed to generate video after ${MAX_RETRIES} attempts: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// getGenerationStatus
// ─────────────────────────────────────────────────────────────────────────────

export async function getGenerationStatus(
  requestId: string
): Promise<GenerationStatus> {
  try {
    const status = await fal.queue.status(requestId, { logs: false });

    const falStatus = status.status as string;

    if (falStatus === "COMPLETED") {
      const result = await fal.queue.result(requestId);
      const output = result.data as {
        video?: { url: string };
        video_url?: string;
      };
      const videoUrl = output?.video?.url ?? output?.video_url;

      return {
        requestId,
        status: "completed",
        progress: 100,
        videoUrl,
      };
    }

    if (falStatus === "FAILED") {
      return {
        requestId,
        status: "failed",
        error: "Generation failed on FAL.AI side",
      };
    }

    if (falStatus === "IN_PROGRESS") {
      return {
        requestId,
        status: "processing",
        progress: 50,
      };
    }

    // IN_QUEUE or unknown
    return {
      requestId,
      status: "pending",
      progress: 0,
    };
  } catch (error) {
    throw new Error(
      `Failed to get generation status: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// routeSceneToModel
// ─────────────────────────────────────────────────────────────────────────────

export function routeSceneToModel(sceneType: string): VideoModel {
  const routing = CHANNELS_CONFIG.modelRouting;
  const assigned = routing[sceneType];

  if (assigned === "kling-3.0" || assigned === "veo-3.1") {
    return assigned;
  }

  // Fuzzy matching: check if sceneType contains any known routing key
  const normalizedScene = sceneType.toLowerCase().replace(/[\s_]/g, "-");

  for (const [key, model] of Object.entries(routing)) {
    if (normalizedScene.includes(key) || key.includes(normalizedScene)) {
      return model as VideoModel;
    }
  }

  // Default routing heuristics based on scene type keywords
  const klingKeywords = [
    "action",
    "battle",
    "fight",
    "creature",
    "cartoon",
    "cooking",
    "vfx",
    "explosion",
    "transform",
    "mascot",
    "multi",
  ];

  const veoKeywords = [
    "speak",
    "talk",
    "narrate",
    "devotional",
    "closeup",
    "close-up",
    "bhajan",
    "lipsync",
    "cinematic",
    "hero",
    "mythology",
  ];

  const lowerScene = sceneType.toLowerCase();

  for (const kw of klingKeywords) {
    if (lowerScene.includes(kw)) return "kling-3.0";
  }

  for (const kw of veoKeywords) {
    if (lowerScene.includes(kw)) return "veo-3.1";
  }

  // Default to kling-3.0 for unrecognized scene types (cheaper, more versatile)
  return "kling-3.0";
}

// ─────────────────────────────────────────────────────────────────────────────
// estimateSceneCost (exported utility)
// ─────────────────────────────────────────────────────────────────────────────

export function estimateSceneCost(
  model: VideoModel,
  durationSeconds: number
): number {
  return estimateCost(model, durationSeconds);
}

// ─────────────────────────────────────────────────────────────────────────────
// estimateVideoCost
// ─────────────────────────────────────────────────────────────────────────────

export function estimateVideoCost(
  scenes: Array<{ modelAssigned: VideoModel; duration: number }>
): { klingCost: number; veoCost: number; totalCost: number } {
  let klingCost = 0;
  let veoCost = 0;

  for (const scene of scenes) {
    const cost = estimateCost(scene.modelAssigned, scene.duration);
    if (scene.modelAssigned === "kling-3.0") {
      klingCost += cost;
    } else {
      veoCost += cost;
    }
  }

  return {
    klingCost: parseFloat(klingCost.toFixed(4)),
    veoCost: parseFloat(veoCost.toFixed(4)),
    totalCost: parseFloat((klingCost + veoCost).toFixed(4)),
  };
}

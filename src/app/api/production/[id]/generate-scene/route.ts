export const dynamic = "force-dynamic";
// Webhook approach — submits to FAL queue and returns immediately (<5s)
// No maxDuration needed; FAL calls our webhook when done.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fal } from '@fal-ai/client';
import prisma from '@/lib/prisma';
import type { VideoModel } from '@/lib/fal';

fal.config({ credentials: process.env.FAL_KEY ?? process.env.FAL_API_KEY });

const FAL_MODEL_IDS: Record<string, string> = {
  'kling-3.0':   'fal-ai/kling-video/v1.6/pro/text-to-video',
  'veo-3.1':     'fal-ai/veo2',
  'ltx-video-2': 'fal-ai/ltx-video',
  'wan-2.1':     'fal-ai/wan-i2v/v2.1/1.3b',
};

const QUALITY_SUFFIX = ', cinematic 4K, ultra-detailed, razor-sharp focus, professional color grading, smooth motion, no watermark, no text overlays, no artifacts, no compression noise';

const GenerateSceneSchema = z.object({
  sceneId: z.string().min(1),
  stylePrefix: z.string().optional(),
  forceKling: z.boolean().optional(),
  modelOverride: z.string().optional(),
  feedback: z.string().optional(),
  promptOverride: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params;
    const body = await request.json();
    const parsed = GenerateSceneSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const { sceneId, stylePrefix, forceKling, modelOverride, feedback, promptOverride } = parsed.data;

    if (!process.env.FAL_KEY && !process.env.FAL_API_KEY) {
      return NextResponse.json(
        { error: 'FAL_KEY not configured. Add FAL_KEY to your Vercel environment variables.' },
        { status: 500 }
      );
    }

    // Webhook URL is optional — if not set, FAL still processes the job and
    // the client will recover the result via polling + rescue-scene endpoint
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    const [video, scene] = await Promise.all([
      prisma.video.findUnique({
        where: { id: videoId },
        include: { script: { select: { description: true } } }, // description = worldSetting
      }),
      prisma.scene.findUnique({ where: { id: sceneId }, select: { id: true, duration: true, modelAssigned: true, prompt: true, promptEn: true, visualGuidance: true, description: true, cameraDirection: true } }),
    ]);

    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    if (!scene) return NextResponse.json({ error: 'Scene not found' }, { status: 404 });

    const model: VideoModel = forceKling ? 'kling-3.0' : ((modelOverride ?? scene.modelAssigned ?? 'ltx-video-2') as VideoModel);
    const usesEnPrompt = model === 'ltx-video-2' || model === 'wan-2.1';
    const durationSeconds = scene.duration ?? 5;

    // World setting: shared background/environment description for visual consistency across all scenes
    const worldSetting = video.script?.description?.trim() ?? '';

    // Build prompt — combine all scene data for the richest possible input
    let basePrompt: string;
    if (promptOverride?.trim()) {
      basePrompt = promptOverride.trim();
    } else {
      // For LTX2/Wan use English keyword prompt; for Kling/Veo use full descriptive prompt
      const corePrompt = usesEnPrompt
        ? ((scene as Record<string, unknown>).promptEn as string | undefined)?.trim() || scene.prompt?.trim() || scene.visualGuidance?.trim() || scene.description?.trim() || ''
        : scene.prompt?.trim() || scene.visualGuidance?.trim() || scene.description?.trim() || '';

      // Append cameraDirection if it adds info not already in the core prompt
      const camDir = scene.cameraDirection?.trim();
      const coreHasCamera = corePrompt.toLowerCase().includes('camera') || corePrompt.toLowerCase().includes('shot');
      const withCamera = camDir && !coreHasCamera
        ? `${corePrompt} Camera: ${camDir}.`
        : corePrompt;

      // Inject world setting as background context so every scene stays visually consistent
      // Only add if the scene doesn't already reference the world in detail
      const worldContext = worldSetting && withCamera.length < 600
        ? ` Background world context: ${worldSetting}`
        : '';

      // Style prefix: weave it in naturally rather than prepending a tag dump
      const withStyle = stylePrefix?.trim()
        ? `${stylePrefix.replace(/,$/, '').trim()}, ${withCamera}${worldContext}`
        : `${withCamera}${worldContext}`;

      // Feedback: rephrase as a natural instruction rather than a bracketed note
      const feedbackSuffix = feedback?.trim()
        ? ` Adjust the scene so that: ${feedback.trim()}.`
        : '';

      basePrompt = withStyle + feedbackSuffix;
    }
    const prompt = basePrompt + QUALITY_SUFFIX;

    // Delete existing clips (regenerate case)
    await prisma.generatedClip.deleteMany({ where: { sceneId } });

    // Build FAL input per model
    const klingDuration = durationSeconds >= 8 ? '10' : '5';
    const negPrompt = 'watermark, logo, text overlay, subtitles, blurry, out of focus, low quality, compression artifacts, distorted faces, deformed hands, extra limbs, floating objects, camera shake, overexposed, underexposed, washed out colors, ugly, worst quality, bad anatomy, mutation, duplicate subjects, stock footage look';
    const input = model === 'kling-3.0'
      ? { prompt, duration: klingDuration, aspect_ratio: '16:9', negative_prompt: negPrompt, cfg_scale: 0.5 }
      : model === 'ltx-video-2'
        ? { prompt, negative_prompt: negPrompt, num_frames: durationSeconds >= 8 ? 161 : 97, aspect_ratio: '16:9' }
      : model === 'wan-2.1'
        ? { prompt, negative_prompt: negPrompt, num_frames: durationSeconds >= 8 ? 161 : 81, aspect_ratio: '16:9' }
      : { prompt, aspect_ratio: '16:9' }; // veo

    // Submit to FAL queue — returns immediately with a request_id.
    // Webhook is optional: if NEXT_PUBLIC_APP_URL is set FAL calls us back automatically;
    // otherwise the client polls and rescue-scene fetches the result directly.
    const submitOptions: { input: typeof input; webhookUrl?: string } = { input };
    if (appUrl) submitOptions.webhookUrl = `${appUrl}/api/webhooks/fal`;

    const { request_id } = await fal.queue.submit(FAL_MODEL_IDS[model], submitOptions);

    // Save job with FAL request_id so webhook can look it up
    await prisma.generationJob.create({
      data: {
        type: 'video-scene',
        videoId,
        sceneId,
        model,
        status: 'pending',
        inputData: { prompt, duration: durationSeconds, model, falRequestId: request_id },
        retryCount: 0,
      },
    });

    await prisma.scene.update({ where: { id: sceneId }, data: { status: 'Generating' } });

    // Return immediately — webhook will save the clip when FAL finishes
    return NextResponse.json({ status: 'queued', requestId: request_id }, { status: 202 });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('POST generate-scene error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

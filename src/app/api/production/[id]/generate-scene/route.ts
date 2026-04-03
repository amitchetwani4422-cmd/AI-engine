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
  'kling-3.0': 'fal-ai/kling-video/v1.6/pro/text-to-video',
  'veo-3.1':   'fal-ai/veo2',
};

const QUALITY_SUFFIX = ', cinematic 1080p, ultra-detailed, sharp focus, professional color grading, no watermark, no artifacts';

const GenerateSceneSchema = z.object({
  sceneId: z.string().min(1),
  stylePrefix: z.string().optional(),
  forceKling: z.boolean().optional(),
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

    const { sceneId, stylePrefix, forceKling, feedback, promptOverride } = parsed.data;

    if (!process.env.FAL_KEY && !process.env.FAL_API_KEY) {
      return NextResponse.json(
        { error: 'FAL_KEY not configured. Add FAL_KEY to your Vercel environment variables.' },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_APP_URL not set. Add it to Vercel environment variables (e.g. https://your-app.vercel.app).' },
        { status: 500 }
      );
    }

    const [video, scene] = await Promise.all([
      prisma.video.findUnique({ where: { id: videoId } }),
      prisma.scene.findUnique({ where: { id: sceneId } }),
    ]);

    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    if (!scene) return NextResponse.json({ error: 'Scene not found' }, { status: 404 });

    const model: VideoModel = forceKling ? 'kling-3.0' : ((scene.modelAssigned ?? 'kling-3.0') as VideoModel);
    const durationSeconds = scene.duration ?? 5;

    // Build prompt
    let basePrompt: string;
    if (promptOverride?.trim()) {
      basePrompt = promptOverride.trim();
    } else {
      const raw = scene.prompt ?? scene.visualGuidance;
      const feedbackSuffix = feedback?.trim() ? ` [Feedback: ${feedback.trim()}]` : '';
      basePrompt = (stylePrefix ? `${stylePrefix} ${raw}` : raw) + feedbackSuffix;
    }
    const prompt = basePrompt + QUALITY_SUFFIX;

    // Delete existing clips (regenerate case)
    await prisma.generatedClip.deleteMany({ where: { sceneId } });

    // Build FAL input
    const klingDuration = durationSeconds >= 8 ? '10' : '5';
    const input = model === 'kling-3.0'
      ? {
          prompt,
          duration: klingDuration,
          aspect_ratio: '16:9',
          negative_prompt: 'watermark, logo, text overlay, blurry, low quality, compression artifacts, distorted faces',
          cfg_scale: 0.5,
        }
      : { prompt, aspect_ratio: '16:9' };

    // Submit to FAL queue — returns immediately with a request_id
    const { request_id } = await fal.queue.submit(FAL_MODEL_IDS[model], {
      input,
      webhookUrl: `${appUrl}/api/webhooks/fal`,
    });

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

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min — Kling takes 60-120s to generate
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { generateVideoScene } from '@/lib/fal';
import type { VideoModel } from '@/lib/fal';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { sceneId, stylePrefix, forceKling, feedback, promptOverride } = parsed.data;

    // Check FAL_KEY early with clear error
    if (!process.env.FAL_KEY && !process.env.FAL_API_KEY) {
      return NextResponse.json(
        { error: 'FAL_KEY not configured. Add FAL_KEY to your Vercel environment variables.' },
        { status: 500 }
      );
    }

    const [video, scene] = await Promise.all([
      prisma.video.findUnique({ where: { id: videoId } }),
      prisma.scene.findUnique({ where: { id: sceneId } }),
    ]);

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    if (!scene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    }

    // forceKling=true (Budget Mode) overrides any Veo assignments — Kling is ~6x cheaper
    const model: VideoModel = forceKling ? 'kling-3.0' : ((scene.modelAssigned ?? 'kling-3.0') as VideoModel);
    const durationSeconds = scene.duration ?? 5;

    // Build the final prompt: override > feedback-modified > original
    let prompt: string;
    if (promptOverride && promptOverride.trim()) {
      // User wrote their own prompt entirely
      prompt = promptOverride.trim();
    } else {
      const basePrompt = scene.prompt ?? scene.visualGuidance;
      const feedbackSuffix = feedback?.trim()
        ? ` [Feedback to incorporate: ${feedback.trim()}]`
        : '';
      const styled = stylePrefix ? `${stylePrefix} ${basePrompt}` : basePrompt;
      prompt = styled + feedbackSuffix;
    }

    // Delete any existing clips for this scene (regenerate case)
    await prisma.generatedClip.deleteMany({ where: { sceneId } });

    // Create generation job
    const job = await prisma.generationJob.create({
      data: {
        type: 'video-scene',
        videoId,
        sceneId,
        model,
        status: 'pending',
        inputData: { prompt, duration: durationSeconds, model },
        retryCount: 0,
      },
    });

    // Update scene status
    await prisma.scene.update({
      where: { id: sceneId },
      data: { status: 'Generating' },
    });

    let result;
    try {
      result = await generateVideoScene({
        model,
        prompt,
        duration: durationSeconds,
        aspectRatio: '16:9',
      });
    } catch (falError) {
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          error: falError instanceof Error ? falError.message : 'FAL generation failed',
          outputData: { error: String(falError) },
        },
      });
      await prisma.scene.update({
        where: { id: sceneId },
        data: { status: 'Failed' },
      });
      return NextResponse.json(
        {
          error: 'Scene generation failed',
          details: falError instanceof Error ? falError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    // Try Cloudinary upload for permanent CDN URL (non-blocking — FAL URL used as fallback)
    let clipUrl = result.videoUrl;
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      try {
        const upload = await cloudinary.uploader.upload(result.videoUrl, {
          resource_type: 'video',
          folder: 'ai-engine/clips',
        });
        clipUrl = upload.secure_url;
      } catch {
        console.warn('Cloudinary upload failed — using FAL URL');
      }
    }

    // Create generated clip
    const clip = await prisma.generatedClip.create({
      data: {
        sceneId,
        videoId,
        clipUrl,
        model,
        prompt,
        duration: durationSeconds,
        cost: result.cost,
        isApproved: true,
        status: 'Generated',
      },
    });

    // Update job to completed
    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: 'completed',
        cost: result.cost,
        outputData: { clipId: clip.id, videoUrl: result.videoUrl, requestId: result.requestId },
      },
    });

    // Update scene status
    await prisma.scene.update({
      where: { id: sceneId },
      data: { status: 'Generated' },
    });

    // Update video cost tracking
    const costIncrement = result.cost;
    const costUpdate =
      model === 'veo-3.1'
        ? { veoCost: { increment: costIncrement }, totalCost: { increment: costIncrement } }
        : { klingCost: { increment: costIncrement }, totalCost: { increment: costIncrement } };

    await prisma.video.update({ where: { id: videoId }, data: costUpdate });

    // Check if all scene jobs for this video are completed
    const allJobs = await prisma.generationJob.findMany({ where: { videoId } });
    const allCompleted = allJobs.every((j) => j.status === 'completed');
    if (allCompleted) {
      await prisma.video.update({
        where: { id: videoId },
        data: { status: 'QualityCheck' },
      });
    }

    return NextResponse.json(clip, { status: 201 });
  } catch (error) {
    console.error('POST /api/production/[id]/generate-scene error:', error);
    return NextResponse.json(
      { error: 'Failed to generate scene' },
      { status: 500 }
    );
  }
}

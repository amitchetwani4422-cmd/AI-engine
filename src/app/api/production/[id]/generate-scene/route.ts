import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import fal from '@/lib/fal';

const GenerateSceneSchema = z.object({
  sceneId: z.string().min(1),
});

// Cost per second estimates (in USD)
const KLING_COST_PER_SECOND = 0.04;
const VEO_COST_PER_SECOND = 0.06;

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

    const { sceneId } = parsed.data;

    const [video, scene] = await Promise.all([
      prisma.video.findUnique({ where: { id: videoId } }),
      prisma.scene.findUnique({
        where: { id: sceneId },
        include: {
          character: true,
          script: { select: { channelId: true } },
        },
      }),
    ]);

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    if (!scene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    }

    // Find or create generation job
    let job = await prisma.generationJob.findFirst({
      where: { videoId, sceneId },
    });

    if (!job) {
      job = await prisma.generationJob.create({
        data: {
          videoId,
          sceneId,
          model: scene.modelRouting ?? 'kling',
          status: 'Pending',
          attempts: 0,
        },
      });
    }

    // Update job to InProgress
    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: 'InProgress',
        startedAt: new Date(),
        attempts: { increment: 1 },
      },
    });

    const model = scene.modelRouting?.toLowerCase() ?? 'kling';
    const durationSeconds = scene.durationSeconds ?? 5;

    let generatedUrl: string;
    let falModel: string;

    // Route to appropriate FAL model
    switch (model) {
      case 'kling':
        falModel = 'fal-ai/kling-video/v1.6/standard/text-to-video';
        break;
      case 'veo':
        falModel = 'fal-ai/veo2';
        break;
      case 'runway':
        falModel = 'fal-ai/runway-gen3/turbo/text-to-video';
        break;
      case 'stable-diffusion':
        falModel = 'fal-ai/stable-diffusion-v3-medium';
        break;
      default:
        falModel = 'fal-ai/kling-video/v1.6/standard/text-to-video';
    }

    try {
      const falResult = await fal.subscribe(falModel, {
        input: {
          prompt: scene.visualPrompt,
          duration: Math.min(durationSeconds, 10),
          aspect_ratio: '16:9',
          ...(scene.character?.visualDescription && {
            negative_prompt: `blurry, low quality, distorted`,
          }),
        },
      }) as { video?: { url?: string }; images?: Array<{ url?: string }>; url?: string };

      // Extract URL from FAL response
      if (falResult.video?.url) {
        generatedUrl = falResult.video.url;
      } else if (falResult.images?.[0]?.url) {
        generatedUrl = falResult.images[0].url;
      } else if (falResult.url) {
        generatedUrl = falResult.url as string;
      } else {
        throw new Error('No URL in FAL response');
      }
    } catch (falError) {
      // Update job to failed
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: 'Failed',
          completedAt: new Date(),
          errorMessage:
            falError instanceof Error ? falError.message : 'FAL generation failed',
        },
      });

      return NextResponse.json(
        {
          error: 'Scene generation failed',
          details: falError instanceof Error ? falError.message : 'Unknown FAL error',
        },
        { status: 500 }
      );
    }

    // Calculate cost
    const sceneCost =
      model === 'veo'
        ? VEO_COST_PER_SECOND * durationSeconds
        : KLING_COST_PER_SECOND * durationSeconds;

    // Create generated clip
    const clip = await prisma.generatedClip.create({
      data: {
        videoId,
        sceneId,
        jobId: job.id,
        url: generatedUrl,
        model: falModel,
        durationSeconds,
        cost: sceneCost,
        status: 'Generated',
      },
    });

    // Update job status to Completed
    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: 'Completed',
        completedAt: new Date(),
        clipId: clip.id,
      },
    });

    // Update video cost tracking
    const costUpdate =
      model === 'veo'
        ? { veoCost: { increment: sceneCost } }
        : { klingCost: { increment: sceneCost } };

    await prisma.video.update({
      where: { id: videoId },
      data: costUpdate,
    });

    // Check if all scenes are completed; update video status if so
    const allJobs = await prisma.generationJob.findMany({
      where: { videoId },
    });
    const allCompleted = allJobs.every((j) => j.status === 'Completed');
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

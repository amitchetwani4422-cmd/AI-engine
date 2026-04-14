export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { v2 as cloudinary } from 'cloudinary';
import prisma from '@/lib/prisma';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

fal.config({ credentials: process.env.FAL_KEY ?? process.env.FAL_API_KEY });

const FAL_MODEL_IDS: Record<string, string> = {
  'kling-3.0':   'fal-ai/kling-video/v1.6/pro/text-to-video',
  'veo-3.1':     'fal-ai/veo2',
  'ltx-video-2': 'fal-ai/ltx-video',
  'wan-2.1':     'fal-ai/wan-i2v/v2.1/1.3b',
};

const COST_PER_SECOND: Record<string, number> = {
  'kling-3.0':   0.056,
  'veo-3.1':     0.08,
  'ltx-video-2': 0.004,
  'wan-2.1':     0.003,
};

// Rescue a stuck scene by fetching the FAL result directly using stored request_id
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params;
    const { sceneId } = await request.json();

    // Find the pending job for this scene
    const jobs = await prisma.generationJob.findMany({
      where: { videoId, sceneId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    if (jobs.length === 0) {
      return NextResponse.json({ error: 'No pending job found for this scene. It may have already completed or never started.' }, { status: 404 });
    }

    const job = jobs[0];
    const inputData = job.inputData as Record<string, unknown>;
    const falRequestId = inputData?.falRequestId as string | undefined;

    if (!falRequestId) {
      return NextResponse.json({ error: 'No FAL request ID stored — job was submitted before webhook support was added. Please regenerate.' }, { status: 400 });
    }

    // Use the exact FAL endpoint the job was submitted to (stored at submission time).
    // Falling back to the logical model lookup handles jobs created before this fix.
    const storedFalModelId = inputData?.falModelId as string | undefined;
    const modelId = storedFalModelId ?? FAL_MODEL_IDS[job.model ?? 'kling-3.0'];

    // Check FAL queue status
    let falStatus: string;
    try {
      const status = await fal.queue.status(modelId, { requestId: falRequestId, logs: false });
      falStatus = status.status as string;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[rescue-scene] fal.queue.status failed:', msg);
      return NextResponse.json({ error: `Could not reach FAL: ${msg}. Try again in a moment.` }, { status: 502 });
    }

    if (falStatus === 'IN_QUEUE' || falStatus === 'IN_PROGRESS') {
      return NextResponse.json({ status: 'still_processing', message: 'FAL is still generating this clip. Check back in a minute.' });
    }

    if (falStatus === 'FAILED') {
      await Promise.all([
        prisma.generationJob.update({ where: { id: job.id }, data: { status: 'failed', error: 'FAL job failed' } }),
        prisma.scene.update({ where: { id: sceneId }, data: { status: 'Failed' } }),
      ]);
      return NextResponse.json({ status: 'failed', message: 'FAL job failed. You can regenerate safely — no double charge.' });
    }

    // COMPLETED — fetch the result: correct API: fal.queue.result(modelId, { requestId })
    const result = await fal.queue.result(modelId, { requestId: falRequestId });
    const output = result.data as { video?: { url: string }; video_url?: string; videos?: Array<{ url: string }> };
    const videoUrl = output?.video?.url ?? output?.video_url ?? output?.videos?.[0]?.url;

    if (!videoUrl) {
      return NextResponse.json({ error: 'FAL job completed but no video URL found in result.' }, { status: 500 });
    }

    // Upload to Cloudinary for a permanent CDN URL (FAL URLs expire in hours)
    let clipUrl = videoUrl;
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      try {
        const upload = await cloudinary.uploader.upload(videoUrl, {
          resource_type: 'video',
          folder: 'ai-engine/clips',
        });
        clipUrl = upload.secure_url;
      } catch {
        console.warn('[rescue-scene] Cloudinary upload failed — using FAL URL as fallback');
      }
    }

    const model = (job.model ?? 'kling-3.0') as string;
    const durationSeconds = (inputData.duration as number) ?? 5;
    const prompt = (inputData.prompt as string) ?? '';
    const cost = parseFloat(((COST_PER_SECOND[model] ?? 0.056) * durationSeconds).toFixed(4));

    // Delete any existing clips for this scene before saving rescued one
    await prisma.generatedClip.deleteMany({ where: { sceneId } });

    // Save the clip
    const clip = await prisma.generatedClip.create({
      data: {
        sceneId,
        videoId,
        clipUrl,
        model,
        prompt,
        duration: durationSeconds,
        cost,
        isApproved: true,
        status: 'Generated',
      },
    });

    const costUpdate = (model === 'veo-3.1' || model === 'ltx-video-2' || model === 'wan-2.1')
      ? { veoCost: { increment: cost }, totalCost: { increment: cost } }
      : { klingCost: { increment: cost }, totalCost: { increment: cost } };

    await Promise.all([
      prisma.generationJob.update({ where: { id: job.id }, data: { status: 'completed', cost, outputData: { clipId: clip.id, videoUrl: clipUrl } } }),
      prisma.scene.update({ where: { id: sceneId }, data: { status: 'Generated' } }),
      prisma.video.update({ where: { id: videoId }, data: costUpdate }),
    ]);

    return NextResponse.json({ status: 'rescued', clip, message: 'Clip recovered successfully!' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('rescue-scene error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

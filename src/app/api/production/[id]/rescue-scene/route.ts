export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import prisma from '@/lib/prisma';

fal.config({ credentials: process.env.FAL_KEY ?? process.env.FAL_API_KEY });

const FAL_MODEL_IDS: Record<string, string> = {
  'kling-3.0':     'fal-ai/kling-video/v1.6/pro/text-to-video',
  'kling-3.0-i2v': 'fal-ai/kling-video/v1.6/pro/image-to-video',
  'kling-2.1':     'fal-ai/kling-video/v2.1/standard/image-to-video',
  'kling-2.1-t2v': 'fal-ai/kling-video/v2.1/standard/text-to-video',
  'minimax':       'fal-ai/minimax-video-01',
  'ltx-video-2':   'fal-ai/ltx-video',
  'wan-2.1':       'fal-ai/wan-i2v/v2.1/1.3b',
  'sync-lipsync':  'fal-ai/sync-lipsync',
  'veo-3.1':       'fal-ai/veo2',
};

const COST_PER_SECOND: Record<string, number> = {
  'kling-3.0':     0.056,
  'kling-3.0-i2v': 0.056,
  'kling-2.1':     0.03,
  'kling-2.1-t2v': 0.03,
  'minimax':       0.02,
  'ltx-video-2':   0.004,
  'wan-2.1':       0.003,
  'sync-lipsync':  0.02,
  'veo-3.1':       0.08,
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

    const modelId = FAL_MODEL_IDS[job.model ?? 'kling-3.0'];

    // Check FAL queue status — correct API: fal.queue.status(modelId, { requestId })
    let falStatus: string;
    try {
      const status = await fal.queue.status(modelId, { requestId: falRequestId, logs: false });
      falStatus = status.status as string;
    } catch {
      return NextResponse.json({ error: 'Could not reach FAL to check job status. Try again in a moment.' }, { status: 502 });
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
        clipUrl: videoUrl,
        model,
        prompt,
        duration: durationSeconds,
        cost,
        isApproved: true,
        status: 'Generated',
      },
    });

    const costUpdate = model === 'veo-3.1'
      ? { veoCost: { increment: cost }, totalCost: { increment: cost } }
      : { klingCost: { increment: cost }, totalCost: { increment: cost } };

    await Promise.all([
      prisma.generationJob.update({ where: { id: job.id }, data: { status: 'completed', cost, outputData: { clipId: clip.id, videoUrl } } }),
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

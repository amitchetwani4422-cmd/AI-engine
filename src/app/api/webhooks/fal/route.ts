export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const COST_PER_SECOND: Record<string, number> = {
  'kling-3.0':   0.056,
  'veo-3.1':     0.08,
  'ltx-video-2': 0.004,
  'wan-2.1':     0.003,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // FAL webhook payload: { request_id, status, payload } or { request_id, error }
    const requestId: string = body.request_id;
    const status: string = body.status; // "OK" | "ERROR"

    if (!requestId) {
      return NextResponse.json({ error: 'Missing request_id' }, { status: 400 });
    }

    // Find the job by FAL request_id stored in inputData
    const jobs = await prisma.generationJob.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const job = jobs.find((j) => {
      const data = j.inputData as Record<string, unknown>;
      return data?.falRequestId === requestId;
    });

    if (!job) {
      console.warn(`FAL webhook: no job found for request_id ${requestId}`);
      return NextResponse.json({ ok: true }); // ack so FAL doesn't retry
    }

    const inputData = job.inputData as Record<string, unknown>;
    const model = (job.model ?? 'kling-3.0') as string;
    const durationSeconds = (inputData.duration as number) ?? 5;
    const prompt = (inputData.prompt as string) ?? '';
    const sceneId = job.sceneId!;
    const videoId = job.videoId!;

    if (status === 'ERROR' || body.error) {
      const errMsg = body.error ?? 'FAL generation failed';
      await Promise.all([
        prisma.generationJob.update({ where: { id: job.id }, data: { status: 'failed', error: errMsg } }),
        prisma.scene.update({ where: { id: sceneId }, data: { status: 'Failed' } }),
      ]);
      return NextResponse.json({ ok: true });
    }

    // Extract video URL from FAL payload
    const payload = body.payload as Record<string, unknown> | undefined;
    const videoFile = payload?.video as { url?: string } | undefined;
    const videoUrl: string | undefined =
      videoFile?.url ??
      (payload?.video_url as string | undefined) ??
      (payload?.videos as Array<{ url: string }> | undefined)?.[0]?.url;

    if (!videoUrl) {
      console.error('FAL webhook: no video URL in payload', JSON.stringify(body).slice(0, 500));
      await prisma.generationJob.update({ where: { id: job.id }, data: { status: 'failed', error: 'No video URL in webhook payload' } });
      return NextResponse.json({ ok: true });
    }

    // Try Cloudinary upload for CDN (optional)
    let clipUrl = videoUrl;
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      try {
        const upload = await cloudinary.uploader.upload(videoUrl, {
          resource_type: 'video',
          folder: 'ai-engine/clips',
        });
        clipUrl = upload.secure_url;
      } catch {
        console.warn('Cloudinary upload failed — using FAL URL');
      }
    }

    const cost = parseFloat((COST_PER_SECOND[model] ?? 0.056) * durationSeconds + '');

    // Save clip
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

    // Update job, scene, video cost
    const costUpdate = (model === 'veo-3.1' || model === 'ltx-video-2' || model === 'wan-2.1')
      ? { veoCost: { increment: cost }, totalCost: { increment: cost } }
      : { klingCost: { increment: cost }, totalCost: { increment: cost } };

    await Promise.all([
      prisma.generationJob.update({
        where: { id: job.id },
        data: { status: 'completed', cost, outputData: { clipId: clip.id, videoUrl: clipUrl } },
      }),
      prisma.scene.update({ where: { id: sceneId }, data: { status: 'Generated' } }),
      prisma.video.update({ where: { id: videoId }, data: costUpdate }),
    ]);

    // If all scenes done, mark video ready
    const allJobs = await prisma.generationJob.findMany({ where: { videoId } });
    if (allJobs.every((j) => j.status === 'completed')) {
      await prisma.video.update({ where: { id: videoId }, data: { status: 'QualityCheck' } });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('FAL webhook error:', msg);
    // Always return 200 to FAL so it doesn't keep retrying
    return NextResponse.json({ ok: true });
  }
}

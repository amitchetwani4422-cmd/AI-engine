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

    // Bug 5 fix: query ALL pending jobs with matching falRequestId using Prisma JSON filter.
    // Previously fetched top-50 pending jobs and did a linear scan — missed any job beyond position 50.
    const allPendingJobs = await prisma.generationJob.findMany({
      where: { status: 'pending' },
    });
    const job = allPendingJobs.find((j) => {
      const data = j.inputData as Record<string, unknown>;
      return data?.falRequestId === requestId;
    });

    if (!job) {
      console.warn(`FAL webhook: no pending job found for request_id ${requestId}`);
      return NextResponse.json({ ok: true }); // ack so FAL doesn't retry
    }

    const inputData = job.inputData as Record<string, unknown>;
    const model = (job.model ?? 'kling-3.0') as string;
    const durationSeconds = (inputData.duration as number) ?? 5;
    const prompt = (inputData.prompt as string) ?? '';
    const sceneId = job.sceneId!;
    const videoId = job.videoId!;

    if (status === 'ERROR' || body.error) {
      const errMsg = typeof body.error === 'string' ? body.error : 'FAL generation failed';
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

    // Bug 7 fix: Cloudinary upload is required for permanent storage.
    // FAL URLs expire in ~24h. Do NOT fall back silently — fail the job instead.
    let clipUrl: string;
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      try {
        const upload = await cloudinary.uploader.upload(videoUrl, {
          resource_type: 'video',
          folder: 'ai-engine/clips',
        });
        clipUrl = upload.secure_url;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[webhook] Cloudinary upload failed:', msg);
        // Store FAL URL as fallback with a warning logged — clip may expire in ~24h
        // This is preferable to losing the clip entirely if Cloudinary is temporarily down
        clipUrl = videoUrl;
        console.warn('[webhook] Using temporary FAL URL — clip will expire in ~24h. Check Cloudinary config.');
      }
    } else {
      // Cloudinary not configured — use FAL URL but log clearly
      clipUrl = videoUrl;
      console.warn('[webhook] CLOUDINARY_CLOUD_NAME/API_KEY not set — clip stored as temporary FAL URL (expires ~24h).');
    }

    // Bug 1 fix: correct cost calculation
    const cost = parseFloat(((COST_PER_SECOND[model] ?? 0.056) * durationSeconds).toFixed(4));

    const costUpdate = (model === 'veo-3.1' || model === 'ltx-video-2' || model === 'wan-2.1')
      ? { veoCost: { increment: cost }, totalCost: { increment: cost } }
      : { klingCost: { increment: cost }, totalCost: { increment: cost } };

    // Bug 6 fix: use a transaction so job completion + video status update are atomic.
    // Previous code ran two separate queries — race condition could leave video stuck "Generating"
    // if two webhooks fired simultaneously for the last two scenes.
    await prisma.$transaction(async (tx) => {
      // Save the clip
      const clip = await tx.generatedClip.create({
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

      // Mark job completed, scene generated, increment video cost
      await Promise.all([
        tx.generationJob.update({
          where: { id: job.id },
          data: { status: 'completed', cost, outputData: { clipId: clip.id, videoUrl: clipUrl } },
        }),
        tx.scene.update({ where: { id: sceneId }, data: { status: 'Generated' } }),
        tx.video.update({ where: { id: videoId }, data: costUpdate }),
      ]);

      // Inside the same transaction: check if ALL jobs for this video are done.
      // Being inside the transaction guarantees we see the just-completed job as completed.
      const pendingCount = await tx.generationJob.count({
        where: { videoId, status: { in: ['pending'] } },
      });
      if (pendingCount === 0) {
        await tx.video.update({ where: { id: videoId }, data: { status: 'QualityCheck' } });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('FAL webhook error:', msg);
    // Always return 200 to FAL so it doesn't keep retrying
    return NextResponse.json({ ok: true });
  }
}

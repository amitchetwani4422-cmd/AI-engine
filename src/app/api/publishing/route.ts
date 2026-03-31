import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const CreatePublishJobSchema = z.object({
  videoId: z.string().min(1),
  platform: z.string().min(1),
  scheduledAt: z.string().datetime().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  thumbnailUrl: z.string().url().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {
      OR: [
        { status: 'ReadyToPublish' },
        { status: 'Published' },
        { status: 'Scheduled' },
        { status: 'PendingApproval' },
      ],
    };

    if (status) {
      where.OR = undefined;
      where.status = status;
    }

    if (channelId) {
      where.video = { channelId };
    }

    const publishJobs = await prisma.publishJob.findMany({
      where,
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
      include: {
        video: {
          select: {
            id: true,
            title: true,
            status: true,
            qualityScore: true,
            channel: { select: { id: true, name: true } },
            script: {
              select: {
                titleOptions: true,
                thumbnailConcepts: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(publishJobs);
  } catch (error) {
    console.error('GET /api/publishing error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch publish jobs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreatePublishJobSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { videoId, platform, scheduledAt, title, description, tags, thumbnailUrl } =
      parsed.data;

    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        script: {
          select: { titleOptions: true },
        },
      },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const publishableStatuses = ['Approved', 'ReadyToPublish', 'QualityCheck'];
    if (!publishableStatuses.includes(video.status)) {
      return NextResponse.json(
        {
          error: `Video status "${video.status}" is not eligible for publishing. Must be one of: ${publishableStatuses.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const publishJob = await prisma.publishJob.create({
      data: {
        videoId,
        platform,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        title:
          title ??
          (video.script?.titleOptions as string[])?.[0] ??
          video.title,
        description: description ?? null,
        tags: tags ?? [],
        thumbnailUrl: thumbnailUrl ?? null,
        status: 'PendingApproval',
      },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            status: true,
            channel: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json(publishJob, { status: 201 });
  } catch (error) {
    console.error('POST /api/publishing error:', error);
    return NextResponse.json(
      { error: 'Failed to create publish job' },
      { status: 500 }
    );
  }
}

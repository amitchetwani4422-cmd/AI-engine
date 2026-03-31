import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const UpdateVideoSchema = z.object({
  status: z.string().optional(),
  title: z.string().optional(),
  qualityScore: z.number().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        script: {
          include: {
            scenes: { orderBy: { sceneNumber: 'asc' } },
            idea: { select: { id: true, title: true, hook: true } },
          },
        },
        channel: { select: { id: true, name: true, primaryPlatform: true } },
        generationJobs: {
          include: {
            scene: true,
            clips: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        clips: {
          orderBy: { createdAt: 'desc' },
        },
        analytics: true,
      },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const totalJobs = video.generationJobs.length;
    const completedJobs = video.generationJobs.filter(
      (j) => j.status === 'Completed'
    ).length;
    const failedJobs = video.generationJobs.filter(
      (j) => j.status === 'Failed'
    ).length;
    const pendingJobs = video.generationJobs.filter(
      (j) => j.status === 'Pending'
    ).length;

    return NextResponse.json({
      ...video,
      productionProgress: {
        totalScenes: totalJobs,
        completedScenes: completedJobs,
        failedScenes: failedJobs,
        pendingScenes: pendingJobs,
        percentComplete:
          totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('GET /api/production/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video production status' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = UpdateVideoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.video.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const video = await prisma.video.update({
      where: { id },
      data: parsed.data,
      include: {
        channel: { select: { id: true, name: true } },
        generationJobs: {
          select: { id: true, status: true, sceneId: true },
        },
      },
    });

    return NextResponse.json(video);
  } catch (error) {
    console.error('PATCH /api/production/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update video' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const UpdateVideoSchema = z.object({
  status: z.string().optional(),
  title: z.string().optional(),
  qualityScore: z.number().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        script: {
          include: {
            sceneBreakdown: {
          orderBy: { sequenceNumber: 'asc' },
          include: { generatedClips: { orderBy: { createdAt: 'asc' } } },
        },
            idea: { select: { id: true, title: true } },
          },
        },
        channel: { select: { id: true, name: true, primaryPlatform: true } },
        generatedClips: { orderBy: { createdAt: 'asc' } },
        analytics: true,
      },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const totalScenes = video.script?.sceneBreakdown.length ?? 0;
    const generatedScenes = new Set(video.generatedClips.map((c) => c.sceneId)).size;

    return NextResponse.json({
      ...video,
      productionProgress: {
        totalScenes,
        generatedScenes,
        percentComplete: totalScenes > 0 ? Math.round((generatedScenes / totalScenes) * 100) : 0,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('GET /api/production/[id] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
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
    if (!existing) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

    const video = await prisma.video.update({
      where: { id },
      data: parsed.data,
      include: {
        channel: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(video);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('PATCH /api/production/[id] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

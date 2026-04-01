export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const StartProductionSchema = z.object({
  scriptId: z.string().min(1),
  channelId: z.string().min(1),
  title: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const channelId = searchParams.get('channelId');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (channelId) where.channelId = channelId;

    const videos = await prisma.video.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        script: {
          select: {
            id: true,
            formatVariant: true,
            _count: { select: { sceneBreakdown: true } },
          },
        },
        channel: { select: { id: true, name: true } },
        generatedClips: { select: { id: true, status: true } },
        _count: { select: { generatedClips: true } },
      },
    });

    return NextResponse.json(videos);
  } catch (error) {
    console.error('GET /api/production error:', error);
    return NextResponse.json({ error: 'Failed to fetch production videos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = StartProductionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { scriptId, channelId, title } = parsed.data;

    const [script, channel] = await Promise.all([
      prisma.script.findUnique({
        where: { id: scriptId },
        include: {
          sceneBreakdown: { orderBy: { sequenceNumber: 'asc' } },
          idea: { select: { id: true, title: true } },
        },
      }),
      prisma.channel.findUnique({ where: { id: channelId } }),
    ]);

    if (!script) return NextResponse.json({ error: 'Script not found' }, { status: 404 });
    if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 });

    if (script.status !== 'Approved') {
      return NextResponse.json(
        { error: 'Script must be approved before starting production' },
        { status: 400 }
      );
    }

    const videoTitle =
      title ??
      (script.titleOptions && (script.titleOptions as string[]).length > 0
        ? (script.titleOptions as string[])[0]
        : script.idea?.title ?? 'Untitled Video');

    const video = await prisma.$transaction(async (tx) => {
      const newVideo = await tx.video.create({
        data: {
          scriptId,
          channelId,
          title: videoTitle,
          status: 'InProduction',
          platform: [channel.primaryPlatform],
          formatVariant: script.formatVariant,
          klingCost: 0,
          veoCost: 0,
        },
      });

      return newVideo;
    });

    const fullVideo = await prisma.video.findUnique({
      where: { id: video.id },
      include: {
        script: {
          include: {
            sceneBreakdown: { orderBy: { sequenceNumber: 'asc' } },
          },
        },
        channel: { select: { id: true, name: true } },
        generatedClips: { orderBy: { createdAt: 'asc' } },
      },
    });

    return NextResponse.json(fullVideo, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('POST /api/production error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

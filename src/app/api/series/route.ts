export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const CreateSeriesSchema = z.object({
  channelId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  characterIds: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');

    const where: Record<string, unknown> = {};
    if (channelId) where.channelId = channelId;

    const series = await prisma.series.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        channel: { select: { id: true, name: true } },
        episodes: { orderBy: { episodeNumber: 'asc' } },
      },
    });

    return NextResponse.json(series);
  } catch (error) {
    console.error('GET /api/series error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch series' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateSeriesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const channel = await prisma.channel.findUnique({
      where: { id: parsed.data.channelId },
    });
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const series = await prisma.series.create({
      data: {
        channelId: parsed.data.channelId,
        name: parsed.data.name,
        description: parsed.data.description ?? '',
        characterIds: parsed.data.characterIds ?? [],
        status: 'Active',
      },
      include: {
        channel: { select: { id: true, name: true } },
        episodes: true,
      },
    });

    return NextResponse.json(series, { status: 201 });
  } catch (error) {
    console.error('POST /api/series error:', error);
    return NextResponse.json(
      { error: 'Failed to create series' },
      { status: 500 }
    );
  }
}

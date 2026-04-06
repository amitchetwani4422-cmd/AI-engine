export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const UpdateSeriesSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  characterIds: z.array(z.string()).optional(),
  continuityLog: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const series = await prisma.series.findUnique({
      where: { id },
      include: {
        channel: { select: { id: true, name: true, primaryPlatform: true } },
        episodes: { orderBy: { episodeNumber: 'asc' } },
        _count: { select: { episodes: true } },
      },
    });

    if (!series) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    }

    return NextResponse.json(series);
  } catch (error) {
    console.error('GET /api/series/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch series' },
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
    const parsed = UpdateSeriesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.series.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    }

    const { name, description, status, characterIds, continuityLog } = parsed.data;
    const series = await prisma.series.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(characterIds !== undefined && { characterIds }),
        ...(continuityLog !== undefined && { continuityLog }),
      },
      include: {
        channel: { select: { id: true, name: true } },
        episodes: { orderBy: { episodeNumber: 'asc' } },
        _count: { select: { episodes: true } },
      },
    });

    return NextResponse.json(series);
  } catch (error) {
    console.error('PATCH /api/series/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update series' },
      { status: 500 }
    );
  }
}

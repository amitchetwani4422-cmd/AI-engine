import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const UpdateSeriesSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  format: z.string().nullable().optional(),
  targetEpisodes: z.number().int().nullable().optional(),
  tags: z.array(z.string()).optional(),
  status: z.string().optional(),
  characterId: z.string().nullable().optional(),
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
        character: {
          include: {
            voiceAsset: { select: { id: true, name: true, provider: true } },
          },
        },
        episodes: {
          orderBy: { episodeNumber: 'asc' },
          include: {
            video: {
              select: {
                id: true,
                title: true,
                status: true,
                qualityScore: true,
                analytics: {
                  select: { views: true, classification: true },
                },
              },
            },
            idea: { select: { id: true, title: true } },
          },
        },
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

    const series = await prisma.series.update({
      where: { id },
      data: parsed.data,
      include: {
        channel: { select: { id: true, name: true } },
        character: { select: { id: true, name: true } },
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

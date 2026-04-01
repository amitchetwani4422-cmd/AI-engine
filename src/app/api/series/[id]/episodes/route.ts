export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const AddEpisodeSchema = z.object({
  ideaId: z.string().optional(),
  videoId: z.string().optional(),
  episodeNumber: z.number().int().optional(),
  title: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const series = await prisma.series.findUnique({ where: { id } });
    if (!series) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    }

    const episodes = await prisma.episode.findMany({
      where: { seriesId: id },
      orderBy: { episodeNumber: 'asc' },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            status: true,
            qualityScore: true,
            klingCost: true,
            veoCost: true,
            analytics: {
              select: {
                views: true,
                watchTimeSeconds: true,
                classification: true,
                revenue: true,
              },
            },
          },
        },
        idea: {
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(episodes);
  } catch (error) {
    console.error('GET /api/series/[id]/episodes error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch episodes' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = AddEpisodeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const series = await prisma.series.findUnique({ where: { id } });
    if (!series) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    }

    // Auto-assign episode number if not provided
    let episodeNumber = parsed.data.episodeNumber;
    if (!episodeNumber) {
      const lastEpisode = await prisma.episode.findFirst({
        where: { seriesId: id },
        orderBy: { episodeNumber: 'desc' },
      });
      episodeNumber = (lastEpisode?.episodeNumber ?? 0) + 1;
    }

    const episode = await prisma.episode.create({
      data: {
        seriesId: id,
        ideaId: parsed.data.ideaId ?? null,
        videoId: parsed.data.videoId ?? null,
        episodeNumber,
        title: parsed.data.title ?? null,
        notes: parsed.data.notes ?? null,
      },
      include: {
        video: {
          select: { id: true, title: true, status: true },
        },
        idea: {
          select: { id: true, title: true },
        },
      },
    });

    return NextResponse.json(episode, { status: 201 });
  } catch (error) {
    console.error('POST /api/series/[id]/episodes error:', error);
    return NextResponse.json(
      { error: 'Failed to add episode' },
      { status: 500 }
    );
  }
}

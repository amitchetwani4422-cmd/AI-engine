import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const UpdateChannelSchema = z.object({
  name: z.string().min(1).optional(),
  niche: z.string().optional(),
  universe: z.string().nullable().optional(),
  targetAudience: z.string().optional(),
  primaryPlatform: z.string().optional(),
  language: z.string().optional(),
  postingFrequency: z.string().nullable().optional(),
  contentPillars: z.array(z.string()).optional(),
  formatStrategy: z.string().nullable().optional(),
  defaultModelPref: z.string().nullable().optional(),
  maxBudgetPerVideo: z.number().nullable().optional(),
  maxBudgetPerWeek: z.number().nullable().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const channel = await prisma.channel.findUnique({
      where: { id },
      include: {
        styleBible: true,
        _count: {
          select: {
            videos: true,
            ideas: true,
            characters: true,
          },
        },
        videos: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            status: true,
            qualityScore: true,
            klingCost: true,
            veoCost: true,
            createdAt: true,
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
        analytics: {
          orderBy: { recordedAt: 'desc' },
          take: 30,
        },
      },
    });

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    return NextResponse.json(channel);
  } catch (error) {
    console.error('GET /api/channels/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channel' },
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
    const parsed = UpdateChannelSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.channel.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const channel = await prisma.channel.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(channel);
  } catch (error) {
    console.error('PATCH /api/channels/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update channel' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.channel.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    await prisma.channel.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/channels/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete channel' },
      { status: 500 }
    );
  }
}

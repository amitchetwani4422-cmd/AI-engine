export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const UpdateChannelSchema = z.object({
  name: z.string().min(1).optional(),
  niche: z.string().optional(),
  universe: z.string().optional(),
  targetAudience: z.string().optional(),
  primaryPlatform: z.string().optional(),
  language: z.string().optional(),
  postingFrequency: z.string().optional(),
  contentPillars: z.array(z.string()).optional(),
  visualStyle: z.string().optional(),
  voiceStyle: z.string().optional(),
  formatStrategy: z.string().nullable().optional(),
  defaultModelPref: z.string().optional(),
  videoPromptSuffix: z.string().nullable().optional(),
  maxBudgetPerVideo: z.number().optional(),
  maxBudgetPerWeek: z.number().optional(),
  status: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const channel = await prisma.channel.findUnique({
      where: { id },
      include: {
        styleBible: true,
        _count: {
          select: { videos: true, ideas: true },
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
                watchTimeHours: true,
                classification: true,
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

    if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    return NextResponse.json(channel);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('GET /api/channels/[id] error:', msg);
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
    const parsed = UpdateChannelSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.channel.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Channel not found' }, { status: 404 });

    const channel = await prisma.channel.update({ where: { id }, data: parsed.data });
    return NextResponse.json(channel);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('PATCH /api/channels/[id] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.channel.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    await prisma.channel.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('DELETE /api/channels/[id] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

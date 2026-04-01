export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const CreateScriptSchema = z.object({
  ideaId: z.string().min(1),
  channelId: z.string().min(1),
  formatVariant: z.string().optional(),
  hook: z.string().optional(),
  fullScript: z.string().optional(),
  narrationDraft: z.string().optional(),
  titleOptions: z.array(z.string()).optional(),
  thumbnailConcepts: z.array(z.string()).optional(),
  musicMood: z.string().optional(),
  status: z.string().optional().default('Draft'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');
    const status = searchParams.get('status');
    const formatVariant = searchParams.get('formatVariant');

    const where: Record<string, unknown> = {};
    if (channelId) where.channelId = channelId;
    if (status) where.status = status;
    if (formatVariant) where.formatVariant = formatVariant;

    const scripts = await prisma.script.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        idea: { select: { id: true, title: true, type: true } },
        channel: { select: { id: true, name: true } },
        _count: { select: { sceneBreakdown: true } },
      },
    });

    return NextResponse.json(scripts);
  } catch (error) {
    console.error('GET /api/scripts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scripts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateScriptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { ideaId, channelId } = parsed.data;

    const [idea, channel] = await Promise.all([
      prisma.idea.findUnique({ where: { id: ideaId } }),
      prisma.channel.findUnique({ where: { id: channelId } }),
    ]);

    if (!idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const script = await prisma.script.create({
      data: {
        ideaId,
        channelId,
        formatVariant: parsed.data.formatVariant ?? null,
        hook: parsed.data.hook ?? null,
        fullScript: parsed.data.fullScript ?? null,
        narrationDraft: parsed.data.narrationDraft ?? null,
        titleOptions: parsed.data.titleOptions ?? [],
        thumbnailConcepts: parsed.data.thumbnailConcepts ?? [],
        musicMood: parsed.data.musicMood ?? null,
        status: parsed.data.status,
      },
      include: {
        idea: { select: { id: true, title: true } },
        channel: { select: { id: true, name: true } },
        sceneBreakdown: true,
      },
    });

    return NextResponse.json(script, { status: 201 });
  } catch (error) {
    console.error('POST /api/scripts error:', error);
    return NextResponse.json(
      { error: 'Failed to create script' },
      { status: 500 }
    );
  }
}

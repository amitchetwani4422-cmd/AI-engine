import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const CreateIdeaSchema = z.object({
  channelId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional().default('Draft'),
  hook: z.string().optional(),
  targetEmotion: z.string().optional(),
  estimatedDuration: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};

    if (channelId) where.channelId = channelId;
    if (status) where.status = status;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const ideas = await prisma.idea.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        channel: {
          select: { id: true, name: true, primaryPlatform: true },
        },
        scores: true,
      },
    });

    return NextResponse.json(ideas);
  } catch (error) {
    console.error('GET /api/ideas error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ideas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateIdeaSchema.safeParse(body);

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

    const idea = await prisma.idea.create({
      data: {
        channelId: parsed.data.channelId,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        type: parsed.data.type ?? null,
        status: parsed.data.status,
        hook: parsed.data.hook ?? null,
        targetEmotion: parsed.data.targetEmotion ?? null,
        estimatedDuration: parsed.data.estimatedDuration ?? null,
        tags: parsed.data.tags ?? [],
        source: 'Manual',
      },
      include: {
        channel: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(idea, { status: 201 });
  } catch (error) {
    console.error('POST /api/ideas error:', error);
    return NextResponse.json(
      { error: 'Failed to create idea' },
      { status: 500 }
    );
  }
}

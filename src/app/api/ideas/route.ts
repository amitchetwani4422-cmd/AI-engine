export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const CreateIdeaSchema = z.object({
  channelId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.string().optional(),
  format: z.string().optional(),
  status: z.string().optional().default('Draft'),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
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
        channel: { select: { id: true, name: true, primaryPlatform: true } },
      },
    });

    return NextResponse.json(ideas);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('GET /api/ideas error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateIdeaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const channel = await prisma.channel.findUnique({ where: { id: parsed.data.channelId } });
    if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 });

    const idea = await prisma.idea.create({
      data: {
        channelId: parsed.data.channelId,
        title: parsed.data.title,
        description: parsed.data.description ?? '',
        type: parsed.data.type ?? 'topic',
        format: parsed.data.format ?? 'long-form',
        status: parsed.data.status ?? 'Draft',
        tags: parsed.data.tags ?? [],
        notes: parsed.data.notes ?? null,
      },
      include: {
        channel: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(idea, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('POST /api/ideas error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

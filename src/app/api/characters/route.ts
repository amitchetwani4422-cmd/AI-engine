export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const CreateCharacterSchema = z.object({
  channelId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  visualDescription: z.string().optional(),
  personality: z.string().optional(),
  backstory: z.string().optional(),
  voiceDescription: z.string().optional(),
  baseImageUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');

    const where: Record<string, unknown> = {};
    if (channelId) where.channelId = channelId;

    const characters = await prisma.character.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        channel: { select: { id: true, name: true } },
        voiceAsset: { select: { id: true, name: true, provider: true } },
        _count: { select: { prompts: true } },
      },
    });

    return NextResponse.json(characters);
  } catch (error) {
    console.error('GET /api/characters error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch characters' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateCharacterSchema.safeParse(body);

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

    const character = await prisma.character.create({
      data: {
        channelId: parsed.data.channelId,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        visualDescription: parsed.data.visualDescription ?? null,
        personality: parsed.data.personality ?? null,
        backstory: parsed.data.backstory ?? null,
        voiceDescription: parsed.data.voiceDescription ?? null,
        baseImageUrl: parsed.data.baseImageUrl ?? null,
        tags: parsed.data.tags ?? [],
      },
      include: {
        channel: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(character, { status: 201 });
  } catch (error) {
    console.error('POST /api/characters error:', error);
    return NextResponse.json(
      { error: 'Failed to create character' },
      { status: 500 }
    );
  }
}

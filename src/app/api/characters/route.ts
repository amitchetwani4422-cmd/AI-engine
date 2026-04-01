export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const CreateCharacterSchema = z.object({
  channelId: z.string().min(1),
  name: z.string().min(1),
  speciesOrType: z.string().default("Human"),
  personality: z.string().default(""),
  worldRole: z.string().default(""),
  clothingRules: z.string().default(""),
  preferredModel: z.string().default("kling-3.0"),
  universeId: z.string().default("A"),
  colorPalette: z.array(z.string()).default([]),
  visualReferences: z.array(z.string()).default([]),
  restrictedChanges: z.array(z.string()).default([]),
  samplePoses: z.array(z.string()).default([]),
  seriesIds: z.array(z.string()).default([]),
});

export async function GET(request: NextRequest) {
  try {
    const channelId = request.nextUrl.searchParams.get('channelId');
    const characters = await prisma.character.findMany({
      where: channelId ? { channelId } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { approvedPrompts: true } },
      },
    });
    return NextResponse.json(characters);
  } catch (error) {
    console.error('GET /api/characters error:', error);
    return NextResponse.json({ error: 'Failed to fetch characters' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateCharacterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const channel = await prisma.channel.findUnique({ where: { id: parsed.data.channelId } });
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const character = await prisma.character.create({
      data: {
        channelId: parsed.data.channelId,
        name: parsed.data.name,
        speciesOrType: parsed.data.speciesOrType,
        personality: parsed.data.personality,
        worldRole: parsed.data.worldRole,
        clothingRules: parsed.data.clothingRules,
        preferredModel: parsed.data.preferredModel,
        universeId: parsed.data.universeId,
        colorPalette: parsed.data.colorPalette,
        visualReferences: parsed.data.visualReferences,
        restrictedChanges: parsed.data.restrictedChanges,
        samplePoses: parsed.data.samplePoses,
        seriesIds: parsed.data.seriesIds,
        approvedImages: [],
        approvedExpressions: [],
      },
      include: { _count: { select: { approvedPrompts: true } } },
    });

    return NextResponse.json(character, { status: 201 });
  } catch (error) {
    console.error('POST /api/characters error:', error);
    return NextResponse.json({ error: 'Failed to create character' }, { status: 500 });
  }
}

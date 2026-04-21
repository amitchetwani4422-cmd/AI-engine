export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const CreateVoiceAssetSchema = z.object({
  name: z.string().min(1),
  provider: z.string().min(1),
  externalVoiceId: z.string().min(1),
  description: z.string().optional(),
  gender: z.string().optional(),
  language: z.string().optional(),
  accent: z.string().optional(),
  characterId: z.string().optional(),
  channelId: z.string().optional(),
  sampleUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');
    const characterId = searchParams.get('characterId');
    const provider = searchParams.get('provider');

    const where: Record<string, unknown> = {};
    if (channelId) where.channelId = channelId;
    if (characterId) where.characterId = characterId;
    if (provider) where.provider = provider;

    const voices = await prisma.voiceAsset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(voices);
  } catch (error) {
    console.error('GET /api/voice error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice assets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateVoiceAssetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const voice = await prisma.voiceAsset.create({
      data: {
        name: parsed.data.name,
        provider: parsed.data.provider,
        elevenlabsVoiceId: parsed.data.externalVoiceId,
        description: parsed.data.description ?? null,
        gender: parsed.data.gender ?? null,
        language: parsed.data.language ?? "English",
        accent: parsed.data.accent ?? null,
        characterId: parsed.data.characterId ?? null,
        channelId: parsed.data.channelId ?? null,
        sampleUrl: parsed.data.sampleUrl ?? null,
        tags: parsed.data.tags ?? [],
        tonePresets: parsed.data.tags ?? [],
        referenceAudios: [],
      },
    });

    return NextResponse.json(voice, { status: 201 });
  } catch (error) {
    console.error('POST /api/voice error:', error);
    return NextResponse.json(
      { error: 'Failed to create voice asset' },
      { status: 500 }
    );
  }
}

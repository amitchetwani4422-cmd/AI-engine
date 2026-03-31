import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const CreateAssetSchema = z.object({
  channelId: z.string().optional(),
  characterId: z.string().optional(),
  type: z.string().min(1),
  name: z.string().min(1),
  url: z.string().url().min(1),
  mimeType: z.string().optional(),
  fileSizeBytes: z.number().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const channelId = searchParams.get('channelId');
    const characterId = searchParams.get('characterId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (channelId) where.channelId = channelId;
    if (characterId) where.characterId = characterId;
    if (status) where.status = status;

    const assets = await prisma.asset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        channel: { select: { id: true, name: true } },
        character: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(assets);
  } catch (error) {
    console.error('GET /api/assets error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateAssetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const asset = await prisma.asset.create({
      data: {
        channelId: parsed.data.channelId ?? null,
        characterId: parsed.data.characterId ?? null,
        type: parsed.data.type,
        name: parsed.data.name,
        url: parsed.data.url,
        mimeType: parsed.data.mimeType ?? null,
        fileSizeBytes: parsed.data.fileSizeBytes ?? null,
        description: parsed.data.description ?? null,
        tags: parsed.data.tags ?? [],
        metadata: parsed.data.metadata ?? {},
        status: 'Active',
      },
      include: {
        channel: { select: { id: true, name: true } },
        character: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error('POST /api/assets error:', error);
    return NextResponse.json(
      { error: 'Failed to create asset' },
      { status: 500 }
    );
  }
}

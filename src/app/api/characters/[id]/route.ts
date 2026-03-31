import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const UpdateCharacterSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  visualDescription: z.string().nullable().optional(),
  personality: z.string().nullable().optional(),
  backstory: z.string().nullable().optional(),
  voiceDescription: z.string().nullable().optional(),
  baseImageUrl: z.string().url().nullable().optional(),
  tags: z.array(z.string()).optional(),
  voiceAssetId: z.string().nullable().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const character = await prisma.character.findUnique({
      where: { id },
      include: {
        channel: { select: { id: true, name: true } },
        prompts: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        voiceAsset: true,
      },
    });

    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(character);
  } catch (error) {
    console.error('GET /api/characters/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch character' },
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
    const parsed = UpdateCharacterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.character.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    const character = await prisma.character.update({
      where: { id },
      data: parsed.data,
      include: {
        channel: { select: { id: true, name: true } },
        voiceAsset: true,
        prompts: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    return NextResponse.json(character);
  } catch (error) {
    console.error('PATCH /api/characters/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update character' },
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

    const existing = await prisma.character.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    await prisma.character.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/characters/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete character' },
      { status: 500 }
    );
  }
}

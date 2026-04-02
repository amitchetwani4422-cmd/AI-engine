export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const UpdateCharacterSchema = z.object({
  name: z.string().min(1).optional(),
  speciesOrType: z.string().optional(),
  personality: z.string().optional(),
  worldRole: z.string().optional(),
  clothingRules: z.string().optional(),
  preferredModel: z.string().optional(),
  universeId: z.string().optional(),
  colorPalette: z.array(z.string()).optional(),
  visualReferences: z.array(z.string()).optional(),
  approvedImages: z.array(z.string()).optional(),
  approvedExpressions: z.array(z.string()).optional(),
  restrictedChanges: z.array(z.string()).optional(),
  samplePoses: z.array(z.string()).optional(),
  seriesIds: z.array(z.string()).optional(),
  voiceId: z.string().nullable().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const character = await prisma.character.findUnique({
      where: { id },
      include: {
        voice: { select: { id: true, name: true, elevenlabsVoiceId: true } },
        approvedPrompts: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }
    return NextResponse.json(character);
  } catch (error) {
    console.error('GET /api/characters/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch character' }, { status: 500 });
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
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const character = await prisma.character.update({
      where: { id },
      data: parsed.data,
      include: {
        voice: { select: { id: true, name: true } },
        approvedPrompts: { orderBy: { createdAt: 'desc' } },
      },
    });
    return NextResponse.json(character);
  } catch (error) {
    console.error('PATCH /api/characters/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update character' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.character.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/characters/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete character' }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const CreatePromptSchema = z.object({
  channelId: z.string().optional(),
  characterId: z.string().optional(),
  targetModel: z.string().min(1),
  category: z.string().min(1),
  title: z.string().min(1),
  promptText: z.string().min(1),
  negativePrompt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetModel = searchParams.get('targetModel');
    const category = searchParams.get('category');
    const channelId = searchParams.get('channelId');
    const isLocked = searchParams.get('isLocked');
    const characterId = searchParams.get('characterId');

    const where: Record<string, unknown> = {};
    if (targetModel) where.targetModel = targetModel;
    if (category) where.category = category;
    if (channelId) where.channelId = channelId;
    if (characterId) where.characterId = characterId;
    if (isLocked !== null) where.isLocked = isLocked === 'true';

    const prompts = await prisma.prompt.findMany({
      where,
      orderBy: [{ isLocked: 'desc' }, { rating: 'desc' }, { createdAt: 'desc' }],
      include: {
        channel: { select: { id: true, name: true } },
        character: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(prompts);
  } catch (error) {
    console.error('GET /api/prompts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreatePromptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const prompt = await prisma.prompt.create({
      data: {
        channelId: parsed.data.channelId ?? null,
        characterId: parsed.data.characterId ?? null,
        targetModel: parsed.data.targetModel,
        category: parsed.data.category,
        title: parsed.data.title,
        promptText: parsed.data.promptText,
        negativePrompt: parsed.data.negativePrompt ?? null,
        tags: parsed.data.tags ?? [],
        notes: parsed.data.notes ?? null,
        isLocked: false,
        rating: null,
      },
      include: {
        channel: { select: { id: true, name: true } },
        character: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(prompt, { status: 201 });
  } catch (error) {
    console.error('POST /api/prompts error:', error);
    return NextResponse.json(
      { error: 'Failed to create prompt' },
      { status: 500 }
    );
  }
}

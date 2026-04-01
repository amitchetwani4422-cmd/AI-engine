export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const UpdatePromptSchema = z.object({
  targetModel: z.string().optional(),
  category: z.string().optional(),
  title: z.string().optional(),
  promptText: z.string().optional(),
  negativePrompt: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
  rating: z.number().min(1).max(10).nullable().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const prompt = await prisma.prompt.findUnique({
      where: { id },
      include: {
        channel: { select: { id: true, name: true } },
        character: { select: { id: true, name: true } },
      },
    });

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    return NextResponse.json(prompt);
  } catch (error) {
    console.error('GET /api/prompts/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompt' },
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
    const parsed = UpdatePromptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.prompt.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    if (existing.isLocked) {
      return NextResponse.json(
        { error: 'Cannot edit a locked prompt. Unlock it first.' },
        { status: 403 }
      );
    }

    const prompt = await prisma.prompt.update({
      where: { id },
      data: parsed.data,
      include: {
        channel: { select: { id: true, name: true } },
        character: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(prompt);
  } catch (error) {
    console.error('PATCH /api/prompts/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update prompt' },
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

    const existing = await prisma.prompt.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    if (existing.isLocked) {
      return NextResponse.json(
        { error: 'Cannot delete a locked prompt. Unlock it first.' },
        { status: 403 }
      );
    }

    await prisma.prompt.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/prompts/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete prompt' },
      { status: 500 }
    );
  }
}

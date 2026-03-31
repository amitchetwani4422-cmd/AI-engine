import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const UpdateScriptSchema = z.object({
  formatVariant: z.string().nullable().optional(),
  hook: z.string().nullable().optional(),
  fullScript: z.string().nullable().optional(),
  narrationDraft: z.string().nullable().optional(),
  titleOptions: z.array(z.string()).optional(),
  thumbnailConcepts: z.array(z.string()).optional(),
  musicMood: z.string().nullable().optional(),
  status: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const script = await prisma.script.findUnique({
      where: { id },
      include: {
        scenes: { orderBy: { sceneNumber: 'asc' } },
        idea: {
          include: {
            scores: true,
          },
        },
        channel: true,
      },
    });

    if (!script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 });
    }

    return NextResponse.json(script);
  } catch (error) {
    console.error('GET /api/scripts/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch script' },
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
    const parsed = UpdateScriptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.script.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 });
    }

    const script = await prisma.script.update({
      where: { id },
      data: parsed.data,
      include: {
        scenes: { orderBy: { sceneNumber: 'asc' } },
        idea: { select: { id: true, title: true } },
        channel: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(script);
  } catch (error) {
    console.error('PATCH /api/scripts/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update script' },
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

    const existing = await prisma.script.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 });
    }

    await prisma.script.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/scripts/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete script' },
      { status: 500 }
    );
  }
}

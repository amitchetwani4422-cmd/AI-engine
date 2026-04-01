export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.prompt.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    // Toggle lock status
    const newLockState = !existing.isLocked;

    const prompt = await prisma.prompt.update({
      where: { id },
      data: {
        isLocked: newLockState,
        lockedAt: newLockState ? new Date() : null,
      },
      include: {
        channel: { select: { id: true, name: true } },
        character: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      ...prompt,
      message: newLockState
        ? 'Prompt locked successfully'
        : 'Prompt unlocked successfully',
    });
  } catch (error) {
    console.error('POST /api/prompts/[id]/lock error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle prompt lock' },
      { status: 500 }
    );
  }
}

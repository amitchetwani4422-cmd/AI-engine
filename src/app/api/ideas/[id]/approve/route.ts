export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const idea = await prisma.idea.findUnique({
      where: { id },
      include: { scores: true },
    });

    if (!idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    if (idea.status === 'Approved') {
      return NextResponse.json(
        { error: 'Idea is already approved' },
        { status: 400 }
      );
    }

    const updatedIdea = await prisma.idea.update({
      where: { id },
      data: {
        status: 'Approved',
        approvedAt: new Date(),
      },
      include: {
        scores: true,
        channel: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updatedIdea);
  } catch (error) {
    console.error('POST /api/ideas/[id]/approve error:', error);
    return NextResponse.json(
      { error: 'Failed to approve idea' },
      { status: 500 }
    );
  }
}

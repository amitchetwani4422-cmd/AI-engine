export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const script = await prisma.script.findUnique({
      where: { id },
      include: {
        sceneBreakdown: { orderBy: { sequenceNumber: 'asc' } },
        idea: { select: { id: true, title: true } },
        channel: { select: { id: true, name: true } },
      },
    });

    if (!script) return NextResponse.json({ error: 'Script not found' }, { status: 404 });
    if (script.status === 'Approved') {
      return NextResponse.json({ error: 'Script is already approved' }, { status: 400 });
    }

    const updated = await prisma.script.update({
      where: { id },
      data: { status: 'Approved' },
      include: {
        sceneBreakdown: { orderBy: { sequenceNumber: 'asc' } },
        idea: { select: { id: true, title: true } },
        channel: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('POST /api/scripts/[id]/approve error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

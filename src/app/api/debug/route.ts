export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/debug — shows DB connectivity and actual column names on Channel table
export async function GET() {
  try {
    // Test raw query to see what columns actually exist in the Channel table
    const columns = await prisma.$queryRaw<{ column_name: string; data_type: string }[]>`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'Channel'
      ORDER BY ordinal_position
    `;

    const channelCount = await prisma.channel.count();

    return NextResponse.json({
      ok: true,
      channelCount,
      channelColumns: columns.map((c) => `${c.column_name} (${c.data_type})`),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

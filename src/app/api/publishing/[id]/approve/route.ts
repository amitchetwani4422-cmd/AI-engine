import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (!["Packaging", "QualityCheck"].includes(video.status)) {
      return NextResponse.json(
        { error: `Cannot approve video in status: ${video.status}` },
        { status: 400 }
      );
    }

    const updated = await prisma.video.update({
      where: { id },
      data: { status: "ReadyToPublish" },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[publishing approve POST]", error);
    return NextResponse.json({ error: "Failed to approve" }, { status: 500 });
  }
}

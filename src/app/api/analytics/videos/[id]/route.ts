export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const analyticsSchema = z.object({
  views: z.number().int().min(0).optional(),
  watchTimeHours: z.number().min(0).optional(),
  retentionNotes: z.string().optional(),
  classification: z.enum(["Winner", "Loser", "Inconclusive"]).optional(),
  repeatRecommend: z.enum(["Yes", "No", "Test variant"]).optional(),
  hookType: z.string().optional(),
  formatUsed: z.string().optional(),
  characterUsed: z.string().optional(),
  voiceUsed: z.string().optional(),
  styleUsed: z.string().optional(),
  musicMood: z.string().optional(),
  klingPercent: z.number().min(0).max(100).optional(),
  veoPercent: z.number().min(0).max(100).optional(),
  publishDate: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const analytics = await prisma.videoAnalytics.findUnique({
      where: { videoId: id },
      include: { video: { select: { title: true, channelId: true } } },
    });
    if (!analytics) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(analytics);
  } catch (error) {
    console.error("[video analytics GET]", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data = analyticsSchema.parse(body);

    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const analytics = await prisma.videoAnalytics.upsert({
      where: { videoId: id },
      update: {
        ...data,
        publishDate: data.publishDate ? new Date(data.publishDate) : undefined,
      },
      create: {
        videoId: id,
        channelId: video.channelId,
        ...data,
        publishDate: data.publishDate ? new Date(data.publishDate) : undefined,
      },
    });

    // If classified as Winner, trigger playbook generation suggestion
    if (data.classification === "Winner") {
      // Mark video for playbook generation (non-blocking)
      await prisma.video.update({
        where: { id },
        data: { status: "Published" },
      });
    }

    return NextResponse.json(analytics);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("[video analytics POST]", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return POST(req, { params });
}

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const schema = z.object({
  channelId: z.string().min(1),
  kanda: z.enum(["Bala", "Ayodhya", "Aranya", "Kishkindha", "Sundara", "Yuddha", "Uttara"]),
  episodeCount: z.number().int().min(1).max(30).optional(), // defaults to all beats in kanda
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const { channelId, kanda, episodeCount } = parsed.data;

    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

    // Fetch story beats for this kanda in sequence
    const beats = await prisma.ramayanaStoryBeat.findMany({
      where: { kanda },
      orderBy: { globalSequence: "asc" },
      take: episodeCount,
    });

    if (beats.length === 0) {
      return NextResponse.json({ error: `No story beats found for kanda: ${kanda}` }, { status: 404 });
    }

    const kandaNames: Record<string, string> = {
      Bala: "बाल काण्ड",
      Ayodhya: "अयोध्या काण्ड",
      Aranya: "अरण्य काण्ड",
      Kishkindha: "किष्किन्धा काण्ड",
      Sundara: "सुन्दर काण्ड",
      Yuddha: "युद्ध काण्ड",
      Uttara: "उत्तर काण्ड",
    };

    // Create Series + Episodes in transaction
    const series = await prisma.$transaction(async (tx) => {
      const newSeries = await tx.series.create({
        data: {
          channelId,
          name: `रामायण — ${kandaNames[kanda]}`,
          description: `वाल्मीकि रामायण के ${kandaNames[kanda]} पर आधारित YouTube Shorts श्रृंखला`,
          kanda,
          status: "Active",
          characterIds: [],
        },
      });

      // Create one episode per story beat
      for (let i = 0; i < beats.length; i++) {
        const beat = beats[i];
        await tx.episode.create({
          data: {
            seriesId: newSeries.id,
            episodeNumber: i + 1,
            title: beat.titleHindi,
            summary: beat.summaryHindi,
            storyBeatId: beat.id,
            status: "Planned",
          },
        });
      }

      return newSeries;
    });

    const fullSeries = await prisma.series.findUnique({
      where: { id: series.id },
      include: {
        episodes: {
          orderBy: { episodeNumber: "asc" },
          include: { storyBeat: true },
        },
        channel: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(fullSeries, { status: 201 });
  } catch (error) {
    console.error("[POST /api/arcs/generate]", error);
    return NextResponse.json({ error: "Failed to generate arc" }, { status: 500 });
  }
}

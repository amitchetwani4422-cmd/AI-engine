export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({ videoId: z.string() });

export async function POST(req: NextRequest) {
  try {
    const { videoId } = schema.parse(await req.json());

    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        analytics: true,
        script: {
          include: { sceneBreakdown: true },
        },
        channel: true,
      },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (video.analytics?.classification !== "Winner") {
      return NextResponse.json(
        { error: "Playbooks can only be generated from Winner-classified videos" },
        { status: 400 }
      );
    }

    const scenes = video.script?.sceneBreakdown ?? [];
    const klingScenes = scenes.filter((s) => s.modelAssigned === "kling-3.0");
    const veoScenes = scenes.filter((s) => s.modelAssigned === "veo-3.1");
    const total = scenes.length || 1;

    const klingPercent = Math.round((klingScenes.length / total) * 100);
    const veoPercent = Math.round((veoScenes.length / total) * 100);

    const playbook = await prisma.formatPlaybook.create({
      data: {
        channelId: video.channelId,
        name: `${video.title} — Winning Format`,
        hookStructure: video.analytics?.hookType ?? video.script?.hook ?? "Opening hook",
        sceneCount: scenes.length,
        pacing: scenes.length <= 5 ? "fast" : scenes.length <= 10 ? "medium" : "slow",
        thumbnailStyle: "winner-thumbnail-style",
        voiceTone: video.analytics?.voiceUsed ?? "engaging",
        musicMood: video.analytics?.musicMood ?? video.script?.musicMood ?? "epic",
        modelRoutingPattern: {
          klingPercent,
          veoPercent,
          typicalKlingScenes: klingScenes.slice(0, 3).map((s) => s.description),
          typicalVeoScenes: veoScenes.slice(0, 3).map((s) => s.description),
        },
        sourceVideoId: videoId,
        isLocked: true,
      },
    });

    return NextResponse.json(playbook, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("[format-playbooks/generate POST]", error);
    return NextResponse.json({ error: "Failed to generate playbook" }, { status: 500 });
  }
}

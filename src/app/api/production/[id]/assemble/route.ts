export const dynamic = "force-dynamic";
export const maxDuration = 60; // Cloudinary does the work server-side — no FFmpeg timeout

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { assembleVideo } from "@/lib/ffmpeg-assembler";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params;

    // ── 1. Load video scenes + their clips ──────────────────────────────────
    // Query through scenes (not video.generatedClips) so clips with null videoId
    // (generated with older code versions) are still included.
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        script: {
          include: {
            sceneBreakdown: {
              orderBy: { sequenceNumber: "asc" },
              include: {
                generatedClips: {
                  where: { status: "Generated" },
                  orderBy: { createdAt: "desc" }, // latest first
                  take: 1, // one clip per scene — handles regenerate/rescue
                },
              },
            },
          },
        },
      },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Build ordered clip list (one per scene, sequence order)
    const scenes = video.script?.sceneBreakdown ?? [];
    const clips = scenes
      .filter((s) => s.generatedClips.length > 0)
      .map((s) => ({
        url: s.generatedClips[0].clipUrl,
        sequenceNumber: s.sequenceNumber,
        duration: s.duration,
      }));

    if (clips.length === 0) {
      return NextResponse.json(
        { error: "No generated clips found. Generate all scenes first." },
        { status: 400 }
      );
    }

    if (clips.length < scenes.length) {
      const missing = scenes.filter((s) => s.generatedClips.length === 0).map((s) => s.sequenceNumber);
      console.warn(`[Assembly] ${missing.length} scene(s) not yet generated: ${missing.join(", ")} — assembling with available clips`);
    }

    // ── 2. Mark video as assembling ──────────────────────────────────────────
    await prisma.video.update({
      where: { id: videoId },
      data: { status: "Assembling" },
    });

    // ── 3. Assemble ──────────────────────────────────────────────────────────
    const clipInputs = clips.map((clip) => ({
      url: clip.url,
      sequenceNumber: clip.sequenceNumber,
      duration: clip.duration,
    }));

    const result = await assembleVideo(videoId, clipInputs);

    // ── 4. Save final video URL + update status ──────────────────────────────
    const updatedVideo = await prisma.video.update({
      where: { id: videoId },
      data: {
        finalVideoUrl: result.finalVideoUrl,
        status: "QualityCheck",
        totalCost: { increment: 0 }, // assembly is free (server-side FFmpeg)
      },
      include: {
        channel: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      video: updatedVideo,
      assembly: {
        finalVideoUrl: result.finalVideoUrl,
        cloudinaryPublicId: result.cloudinaryPublicId,
        totalDuration: result.totalDuration,
        clipsUsed: result.clipsUsed,
      },
    });
  } catch (error) {
    console.error("[assembly POST]", error);

    // Reset status on failure
    const { id: videoId } = await params;
    await prisma.video.update({
      where: { id: videoId },
      data: { status: "InProduction" },
    }).catch(() => {});

    return NextResponse.json(
      {
        error: "Assembly failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// GET — check if assembly is available (all scenes generated)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: videoId } = await params;

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: {
      _count: { select: { generatedClips: true } },
      script: {
        include: { _count: { select: { sceneBreakdown: true } } },
      },
    },
  });

  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const totalScenes = video.script?._count.sceneBreakdown ?? 0;
  const generatedClips = video._count.generatedClips;
  const ready = generatedClips > 0 && generatedClips >= totalScenes;

  return NextResponse.json({
    ready,
    totalScenes,
    generatedClips,
    finalVideoUrl: video.finalVideoUrl,
    status: video.status,
  });
}

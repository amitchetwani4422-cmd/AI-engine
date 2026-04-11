export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type VideoModel = "ltx-video-2" | "wan-2.1" | "kling-3.0";

// Keyword sets for model routing
const KLING_KEYWORDS = [
  // English shot types
  "close-up", "closeup", "close up", "extreme close", "tight shot",
  "face", "portrait", "expression", "divine appearance", "divine moment",
  "hero shot", "reaction", "tears", "prayer", "devotion", "emotional",
  "low reverential", "devotional push", "push-in", "rack-focus",
  "divine eyes", "divine glow", "aura", "halo",
  // Hindi
  "भाव", "दिव्य", "भक्ति", "प्रार्थना", "आँसू", "नयन", "मुखमंडल", "संवाद",
];

const WAN_KEYWORDS = [
  // English shot types
  "mid-shot", "medium shot", "mid shot", "over-shoulder", "over shoulder",
  "exterior", "outdoor", "forest", "jungle", "walk", "approach",
  "moving", "moderate action", "chase",
  // Hindi
  "वन", "जंगल", "चलते", "बाहर", "वन में", "आश्रम",
];

const LTX_KEYWORDS = [
  // English shot types
  "wide", "establishing", "landscape", "panoramic", "aerial",
  "birds-eye", "bird's eye", "overhead", "crane descend", "crane shot",
  "high angle", "sweeping", "vast", "horizon",
  "architecture", "temple", "palace", "city", "mountain", "river",
  "background", "environment", "nature", "sky", "ocean",
  // Hindi
  "स्थापत्य", "महल", "मंदिर", "पर्वत", "आकाश", "नगर", "समुद्र", "प्रस्तावना",
];

function countHits(text: string, keywords: string[]): number {
  return keywords.reduce((n, kw) => n + (text.includes(kw) ? 1 : 0), 0);
}

function assignModel(scene: {
  description?: string | null;
  cameraDirection?: string | null;
  visualGuidance?: string | null;
  routingReason?: string | null;
  prompt?: string | null;
  promptEn?: string | null;
}): { model: VideoModel; reason: string } {
  const text = [
    scene.description,
    scene.cameraDirection,
    scene.visualGuidance,
    scene.routingReason,
    scene.prompt,
    scene.promptEn,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const klingScore = countHits(text, KLING_KEYWORDS);
  const wanScore   = countHits(text, WAN_KEYWORDS);
  const ltxScore   = countHits(text, LTX_KEYWORDS);

  if (klingScore > wanScore && klingScore > ltxScore) {
    return { model: "kling-3.0", reason: `Close-up / hero moment (score: kling ${klingScore}, wan ${wanScore}, ltx ${ltxScore})` };
  }
  if (wanScore > ltxScore) {
    return { model: "wan-2.1", reason: `Mid / exterior shot (score: wan ${wanScore}, ltx ${ltxScore}, kling ${klingScore})` };
  }
  if (ltxScore > 0) {
    return { model: "ltx-video-2", reason: `Wide / landscape shot (score: ltx ${ltxScore}, wan ${wanScore}, kling ${klingScore})` };
  }

  // Tie or zero — default based on sequence position heuristic: first scene usually establishing
  return { model: "ltx-video-2", reason: `Default — no strong signal (scores: ltx ${ltxScore}, wan ${wanScore}, kling ${klingScore})` };
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params;

    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: { script: { include: { sceneBreakdown: { orderBy: { sequenceNumber: "asc" } } } } },
    });

    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    const scenes = video.script?.sceneBreakdown ?? [];
    if (scenes.length === 0) return NextResponse.json({ error: "No scenes found" }, { status: 400 });

    // Override first scene as LTX2 if no strong signal — establishing shots are almost always first
    const updates = scenes.map((scene, index) => {
      const { model, reason } = assignModel(scene);
      // First scene with no clips yet: nudge toward LTX2 unless strongly Kling
      const finalModel =
        index === 0 && model !== "kling-3.0"
          ? "ltx-video-2"
          : model;
      return { id: scene.id, model: finalModel, reason };
    });

    // Batch update
    await Promise.all(
      updates.map(({ id, model, reason }) =>
        prisma.scene.update({
          where: { id },
          data: { modelAssigned: model, routingReason: reason },
        })
      )
    );

    const summary = updates.reduce<Record<string, number>>((acc, u) => {
      acc[u.model] = (acc[u.model] ?? 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({ ok: true, total: updates.length, summary, updates });
  } catch (error) {
    console.error("[POST reroute-scenes]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

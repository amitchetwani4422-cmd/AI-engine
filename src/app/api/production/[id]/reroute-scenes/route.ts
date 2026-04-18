export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Keyword-based scene routing — maps content signals to the best AI video model.
// Checked in priority order: first match wins.
const ROUTING_RULES: Array<{ model: string; keywords: string[] }> = [
  {
    model: "sync-lipsync",
    keywords: [
      "speaks to camera", "talks to camera", "direct address", "looking at camera",
      "facing camera", "direct to camera", "lipsync", "lip sync", "monologue",
      "host speaks", "narrator speaks", "host looks", "direct dialogue",
    ],
  },
  {
    model: "ltx-video-2",
    keywords: [
      "b-roll", "beauty shot", "food closeup", "food close-up", "texture",
      "steam rising", "steam", "pouring ghee", "ghee pour", "drizzle", "sizzle",
      "mustard seeds", "crackling", "dal simmering", "simmering", "slow motion",
      "slow-mo", "macro", "ingredient", "spice closeup", "garnish", "plating closeup",
      "atmospheric b-roll", "food b-roll", "food texture", "liquid pour",
    ],
  },
  {
    model: "minimax",
    keywords: [
      "dramatic", "epic", "cinematic reveal", "emotional reveal", "flashback",
      "jungle", "forest scene", "mythological", "story scene", "backstory",
      "historical", "ancient", "battle", "conflict", "sweeping", "establishing wide",
      "wide establishing", "slow crane", "dramatic crane", "aerial", "epic scale",
    ],
  },
  {
    model: "kling-2.1",
    keywords: [
      "kitchen", "cooking action", "stirring", "shaping dough", "rolling dough",
      "kneading", "chopping", "cutting", "kitchen counter", "stove", "chulha",
      "character in kitchen", "host cooking", "cooking close",
    ],
  },
];

function routeScene(scene: {
  description: string;
  routingReason: string;
  visualGuidance: string;
  cameraDirection: string;
  narrationText: string | null;
  prompt: string | null;
}): string {
  const haystack = [
    scene.description,
    scene.routingReason,
    scene.visualGuidance,
    scene.cameraDirection,
    scene.narrationText ?? "",
    scene.prompt ?? "",
  ]
    .join(" ")
    .toLowerCase();

  for (const rule of ROUTING_RULES) {
    if (rule.keywords.some((kw) => haystack.includes(kw))) {
      return rule.model;
    }
  }

  // Default: character / action scene → Kling 3.0
  return "kling-3.0";
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params;

    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: {
        script: {
          select: {
            sceneBreakdown: {
              select: {
                id: true,
                description: true,
                routingReason: true,
                visualGuidance: true,
                cameraDirection: true,
                narrationText: true,
                prompt: true,
              },
            },
          },
        },
      },
    });

    if (!video?.script) {
      return NextResponse.json({ error: "Video or script not found" }, { status: 404 });
    }

    const scenes = video.script.sceneBreakdown;
    const summary: Record<string, number> = {};

    await Promise.all(
      scenes.map(async (scene) => {
        const model = routeScene(scene);
        summary[model] = (summary[model] ?? 0) + 1;
        await prisma.scene.update({
          where: { id: scene.id },
          data: { modelAssigned: model },
        });
      })
    );

    return NextResponse.json({ ok: true, total: scenes.length, summary });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

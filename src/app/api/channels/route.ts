export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const CreateChannelSchema = z.object({
  name: z.string().min(1),
  niche: z.string().min(1),
  universe: z.string().min(1),
  targetAudience: z.string().min(1),
  primaryPlatform: z.string().min(1),
  language: z.string().min(1),
  postingFrequency: z.string().optional(),
  contentPillars: z.array(z.string()).optional(),
  visualStyle: z.string().optional(),
  voiceStyle: z.string().optional(),
  formatStrategy: z.string().optional(),
  defaultModelPref: z.string().optional(),
  maxBudgetPerVideo: z.number().optional(),
  maxBudgetPerWeek: z.number().optional(),
});

export async function GET() {
  try {
    const channels = await prisma.channel.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { ideas: true, videos: true },
        },
      },
    });
    return NextResponse.json(channels);
  } catch (error) {
    console.error("GET /api/channels error:", error);
    return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateChannelSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const channel = await prisma.channel.create({
      data: {
        name: data.name,
        niche: data.niche,
        universe: data.universe,
        targetAudience: data.targetAudience,
        primaryPlatform: data.primaryPlatform,
        language: data.language,
        postingFrequency: data.postingFrequency ?? "Weekly",
        contentPillars: data.contentPillars ?? [],
        visualStyle: data.visualStyle ?? "",
        voiceStyle: data.voiceStyle ?? "",
        formatStrategy: data.formatStrategy ?? null,
        defaultModelPref: data.defaultModelPref ?? "kling-heavy",
        maxBudgetPerVideo: data.maxBudgetPerVideo ?? 10,
        maxBudgetPerWeek: data.maxBudgetPerWeek ?? 50,
      },
    });

    return NextResponse.json(channel, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("POST /api/channels error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

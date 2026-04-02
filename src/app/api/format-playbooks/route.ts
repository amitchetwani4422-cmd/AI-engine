export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const playbookSchema = z.object({
  channelId: z.string(),
  name: z.string().min(1),
  hookStructure: z.string(),
  sceneCount: z.number().int().min(1),
  pacing: z.string(),
  thumbnailStyle: z.string(),
  voiceTone: z.string(),
  musicMood: z.string(),
  modelRoutingPattern: z.object({
    klingPercent: z.number(),
    veoPercent: z.number(),
    typicalKlingScenes: z.array(z.string()).optional(),
    typicalVeoScenes: z.array(z.string()).optional(),
  }),
  sourceVideoId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const channelId = req.nextUrl.searchParams.get("channelId");
    const playbooks = await prisma.formatPlaybook.findMany({
      where: channelId ? { channelId } : {},
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(playbooks);
  } catch (error) {
    console.error("[format-playbooks GET]", error);
    return NextResponse.json({ error: "Failed to fetch playbooks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = playbookSchema.parse(body);

    const playbook = await prisma.formatPlaybook.create({
      data: {
        ...data,
        isLocked: true,
      },
    });

    return NextResponse.json(playbook, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("[format-playbooks POST]", error);
    return NextResponse.json({ error: "Failed to create playbook" }, { status: 500 });
  }
}

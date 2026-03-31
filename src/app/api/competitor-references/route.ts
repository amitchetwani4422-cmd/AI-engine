import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const refSchema = z.object({
  channelId: z.string(),
  url: z.string().url(),
  platform: z.enum(["youtube", "instagram", "tiktok"]),
  formatType: z.string().optional(),
  hookStructure: z.string().optional(),
  whatWorked: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const channelId = req.nextUrl.searchParams.get("channelId");
    const tag = req.nextUrl.searchParams.get("tag");

    const refs = await prisma.competitorReference.findMany({
      where: {
        ...(channelId ? { channelId } : {}),
        ...(tag ? { tags: { has: tag } } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(refs);
  } catch (error) {
    console.error("[competitor-refs GET]", error);
    return NextResponse.json({ error: "Failed to fetch references" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = refSchema.parse(body);

    const ref = await prisma.competitorReference.create({ data });
    return NextResponse.json(ref, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("[competitor-refs POST]", error);
    return NextResponse.json({ error: "Failed to create reference" }, { status: 500 });
  }
}

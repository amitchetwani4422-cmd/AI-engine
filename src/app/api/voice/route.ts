export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channelId");
    const characterId = searchParams.get("characterId");

    const where: Record<string, unknown> = {};
    if (channelId) where.channelId = channelId;
    if (characterId) where.characterId = characterId;

    const voices = await prisma.voiceAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(voices);
  } catch (error) {
    console.error("GET /api/voice error:", error);
    return NextResponse.json({ error: "Failed to fetch voice assets" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, elevenlabsVoiceId, channelId, characterId, language, isMultilingual, tonePresets, referenceAudios } = body as Record<string, unknown>;

    if (!name || !elevenlabsVoiceId) {
      return NextResponse.json({ error: "name and elevenlabsVoiceId are required" }, { status: 400 });
    }

    const voice = await prisma.voiceAsset.create({
      data: {
        name: name as string,
        elevenlabsVoiceId: elevenlabsVoiceId as string,
        channelId: (channelId as string) ?? "default",
        characterId: (characterId as string) ?? null,
        language: (language as string) ?? "Hindi",
        isMultilingual: (isMultilingual as boolean) ?? false,
        tonePresets: Array.isArray(tonePresets) ? (tonePresets as string[]) : [],
        referenceAudios: Array.isArray(referenceAudios) ? (referenceAudios as string[]) : [],
      },
    });

    return NextResponse.json(voice, { status: 201 });
  } catch (error) {
    console.error("POST /api/voice error:", error);
    return NextResponse.json({ error: "Failed to create voice asset" }, { status: 500 });
  }
}

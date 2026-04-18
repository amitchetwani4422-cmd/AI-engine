export const dynamic = "force-dynamic";
/**
 * POST /api/production/[id]/backfill-characters
 *
 * Re-scans each scene's text (prompt + narration + description) and links the
 * correct characters from this video's channel into scene.characterIds.
 * Uses word-boundary matching to avoid substring false-positives (e.g. "rama" in "Ramayana").
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const RAMAYANA_NAME_ALIASES: Record<string, string[]> = {
  ram:         ["राम", "श्री राम", "shri ram", "lord ram", "rama"],
  sita:        ["सीता", "sita mata", "janaki", "maithili", "vaidehi"],
  hanuman:     ["हनुमान", "bajrangbali", "pawanputra", "mahavir"],
  lakshman:    ["लक्ष्मण", "laxman", "lakshmana", "saumitra"],
  ravan:       ["रावण", "ravana", "ravanan", "dashanan", "dashagriva"],
  dasharath:   ["दशरथ", "dasharatha", "dashrath", "king dasharath"],
  kaushalya:   ["कौशल्या", "kausalya"],
  kaikeyi:     ["कैकेयी", "kekeyi"],
  vashishtha:  ["वशिष्ठ", "vasishtha", "vasistha", "maharishi vashishtha", "maharishi vasishtha", "guru vashishtha"],
  vishwamitra: ["विश्वामित्र", "vishvamitra", "maharishi vishwamitra"],
  sugriva:     ["सुग्रीव", "sugreeva"],
  vibhishan:   ["विभीषण", "vibhishana", "vibheeshana"],
  jatayu:      ["जटायु"],
  shabari:     ["शबरी", "sabari"],
  mandodari:   ["मंदोदरी", "mandodhari"],
  manthara:    ["मंथरा"],
  bharat:      ["भरत", "bharata"],
  shatrughan:  ["शत्रुघ्न", "shatrughna"],
  angad:       ["अंगद", "angada"],
  jambavan:    ["जामवंत", "jambavant"],
  shurpanakha: ["शूर्पणखा", "surpanakha"],
  kumbhakarna: ["कुंभकर्ण", "kumbhakaran"],
  indrajit:    ["इंद्रजीत", "meghnad", "meghanad"],
  vali:        ["वाली", "bali"],
};

function buildTokens(name: string): string[] {
  const canonical = name.toLowerCase();
  const tokens = new Set<string>([canonical]);
  const aliases = RAMAYANA_NAME_ALIASES[canonical];
  if (aliases) aliases.forEach((a) => tokens.add(a.toLowerCase()));
  return [...tokens];
}

function matchesWholeWord(text: string, token: string): boolean {
  if (token.includes(" ")) return text.includes(token);
  if (/[\u0900-\u097F]/.test(token)) return text.includes(token);
  try {
    return new RegExp(`(?<![a-z])${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-z])`, "i").test(text);
  } catch {
    return text.includes(token);
  }
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
        channelId: true,
        script: {
          select: {
            sceneBreakdown: {
              select: {
                id: true,
                description: true,
                prompt: true,
                promptEn: true,
                narrationText: true,
                visualGuidance: true,
                cameraDirection: true,
              },
            },
          },
        },
      },
    });

    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

    const channelChars = await prisma.character.findMany({
      where: { channelId: video.channelId },
      select: { id: true, name: true },
    });

    const scenes = video.script?.sceneBreakdown ?? [];
    let updatedCount = 0;
    const characterNames = channelChars.map((c) => c.name);

    await Promise.all(
      scenes.map(async (scene) => {
        const sceneText = [
          scene.prompt,
          scene.promptEn,
          scene.narrationText,
          scene.visualGuidance,
          scene.description,
          scene.cameraDirection,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchedIds = channelChars
          .filter((char) =>
            buildTokens(char.name).some((t) => matchesWholeWord(sceneText, t))
          )
          .map((c) => c.id);

        await prisma.scene.update({
          where: { id: scene.id },
          data: { characterIds: matchedIds },
        });
        if (matchedIds.length > 0) updatedCount++;
      })
    );

    return NextResponse.json({
      ok: true,
      message: `Linked characters in ${updatedCount}/${scenes.length} scenes`,
      debug: {
        charactersFoundInChannel: channelChars.length,
        characterNames,
        sampleSceneText: scenes[0]
          ? [scenes[0].description, scenes[0].narrationText].filter(Boolean).join(" ").slice(0, 150)
          : null,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

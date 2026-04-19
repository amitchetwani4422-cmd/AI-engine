export const dynamic = "force-dynamic";
/**
 * POST /api/production/[id]/backfill-characters
 *
 * Links channel characters to scenes via characterIds.
 *
 * Strategy (in priority order):
 *  1. Name match — character name / aliases appear verbatim in scene text
 *  2. Single-host fallback — if the channel has exactly ONE character and
 *     zero scenes matched by name (host is referenced as "she"/"he"/"host"),
 *     assign that character to every scene that looks like it involves a person
 *     (kling-3.0 / kling-2.1 model assigned, or keywords like "woman/man/host/chef/she/he")
 *  3. Zero-match, multi-char — leave empty (user must manually assign)
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

// Keywords that indicate a human appears on screen (used for single-host fallback)
const HUMAN_PRESENCE_KEYWORDS = [
  "she ", "he ", "her ", "his ", "woman", "man", "girl", "boy",
  "host", "chef", "cook", "narrator", "person", "character",
  "walks", "stands", "sits", "looks", "smiles", "speaks", "holds",
  "gesture", "farewell", "address", "introduction", "close-up of",
  // Hindi pronouns / common terms
  "वह ", "वो ", "main ", "mein ",
];

// Models that render human characters (not pure b-roll)
const CHARACTER_MODELS = new Set(["kling-3.0", "kling-2.1", "sync-lipsync"]);

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

function sceneHasHuman(sceneText: string, modelAssigned: string): boolean {
  if (CHARACTER_MODELS.has(modelAssigned)) return true;
  return HUMAN_PRESENCE_KEYWORDS.some((kw) => sceneText.includes(kw));
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
                modelAssigned: true,
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
    const characterNames = channelChars.map((c) => c.name);

    // ── Pass 1: name/alias matching ─────────────────────────────────────────
    const sceneResults: { id: string; matchedIds: string[]; sceneText: string; modelAssigned: string }[] = scenes.map((scene) => {
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
        .filter((char) => buildTokens(char.name).some((t) => matchesWholeWord(sceneText, t)))
        .map((c) => c.id);

      return { id: scene.id, matchedIds, sceneText, modelAssigned: scene.modelAssigned };
    });

    const totalNameMatched = sceneResults.filter((s) => s.matchedIds.length > 0).length;

    // ── Pass 2: single-host fallback ────────────────────────────────────────
    // If exactly 1 channel character and ZERO scenes matched by name,
    // assign that character to every scene that has human presence.
    let usedFallback = false;
    if (channelChars.length === 1 && totalNameMatched === 0) {
      usedFallback = true;
      const soloCharId = channelChars[0].id;
      for (const sr of sceneResults) {
        if (sceneHasHuman(sr.sceneText, sr.modelAssigned)) {
          sr.matchedIds = [soloCharId];
        }
      }
    }

    // ── Write to DB ─────────────────────────────────────────────────────────
    let updatedCount = 0;
    await Promise.all(
      sceneResults.map(async (sr) => {
        await prisma.scene.update({
          where: { id: sr.id },
          data: { characterIds: sr.matchedIds },
        });
        if (sr.matchedIds.length > 0) updatedCount++;
      })
    );

    const method = usedFallback
      ? `single-host fallback (no name match found for "${channelChars[0].name}" — assigned to all human-presence scenes)`
      : "name matching";

    return NextResponse.json({
      ok: true,
      message: `Linked characters in ${updatedCount}/${scenes.length} scenes via ${method}`,
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

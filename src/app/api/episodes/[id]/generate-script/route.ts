export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateWithModel, DEFAULT_SCRIPT_MODEL } from "@/lib/ai-provider";
import type { AIModel } from "@/lib/ai-provider";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const aiModel = ((body as Record<string, unknown>).aiModel ?? DEFAULT_SCRIPT_MODEL) as AIModel;

    const episode = await prisma.episode.findUnique({
      where: { id },
      include: {
        series: { include: { channel: { include: { styleBible: true } } } },
        storyBeat: true,
      },
    });

    if (!episode) return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    if (!episode.storyBeat) return NextResponse.json({ error: "Episode has no story beat linked" }, { status: 400 });

    const beat = episode.storyBeat;
    const channel = episode.series.channel;

    // Fetch characters mentioned in beat from DB for visual consistency
    const characters = await prisma.character.findMany({
      where: { channelId: channel.id },
    });

    const characterMap = Object.fromEntries(characters.map((c) => [c.name, c]));
    const relevantChars = beat.characters
      .map((name) => characterMap[name])
      .filter(Boolean);

    const characterDescriptions = relevantChars.length > 0
      ? relevantChars.map((c) => {
          if (!c) return "";
          return `${c.name}: ${c.visualReferences.join("; ")}. वस्त्र: ${c.clothingRules}. रंग: ${c.colorPalette.join(", ")}.`;
        }).join("\n")
      : beat.characters.map((n) => `${n}: (पात्र — दिव्य भारतीय पौराणिक शैली)`).join("\n");

    const styleGuide = channel.styleBible
      ? `विज़ुअल स्टाइल: ${channel.visualStyle}\nप्रकाश: ${channel.styleBible.lightingPreferences}\nकैमरा: ${channel.styleBible.cameraFeel}\nसंगीत: ${channel.styleBible.musicDirection}\nनरेशन: ${channel.styleBible.narrationTone}`
      : `विज़ुअल स्टाइल: ${channel.visualStyle}\nआवाज़: ${channel.voiceStyle}`;

    const systemPrompt = `आप एक पेशेवर हिंदी स्क्रिप्ट लेखक और AI वीडियो डायरेक्टर हैं जो वाल्मीकि रामायण पर आधारित 1 मिनट के YouTube Shorts बनाते हैं।
आप Kling 1.6 Pro के लिए सटीक AI वीडियो प्रॉम्प्ट लिखते हैं।
सभी संवाद, मंत्र और कथा वाल्मीकि रामायण के अनुसार सही होने चाहिए।
केवल valid JSON में उत्तर दें — कोई markdown नहीं।`;

    const userPrompt = `इस रामायण प्रसंग पर 1 मिनट का Hindi YouTube Short बनाएं:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
प्रसंग: ${beat.titleHindi}
काण्ड: ${beat.kanda} Kanda (${beat.kandaNumber})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

सारांश: ${beat.summaryHindi}

कथा बिंदु (इसी क्रम में दिखाएं):
${beat.storyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

पात्र: ${beat.characters.join(", ")}

${beat.keyMantra ? `मंत्र/श्लोक (शब्द-दर-शब्द सही रखें): "${beat.keyMantra}"
हिंदी अर्थ: ${beat.mantraHindi}` : ""}

हुक लाइन (पहले 3 सेकंड में): "${beat.hookLine}"

भावनात्मक टोन: ${beat.emotionalTone}
दृश्य टोन: ${beat.visualTone}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
पात्रों का दृश्य विवरण (AI में consistency के लिए हर scene में यही रखें):
${characterDescriptions}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

चैनल स्टाइल गाइड:
${styleGuide}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WORLD SETTING (पहले define करें — सभी scenes इसी दुनिया में होंगे):
एक 4-6 वाक्य का paragraph जो बताए: काल, स्थान, स्थापत्य शैली, रंग पैलेट, प्रकाश।
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SCENE PROMPT नियम (हर scene में):
- 3-लेयर बैकग्राउंड: Foreground (धुआँ/फूल/अग्नि), Midground (पात्र), Background (मंदिर/आकाश/वन)
- पात्र का सटीक विवरण: रंग, वस्त्र, भाव, मुद्रा
- कैमरा मूवमेंट: शुरुआत → गति → अंत
- प्रकाश: volumetric rays, color palette

RESPONSE FORMAT:
{
  "hook": "हिंदी में 3 सेकंड का hook",
  "fullScript": "पूरी हिंदी नरेशन स्क्रिप्ट — ${beat.keyMantra ? "मंत्र संस्कृत में, बाकी हिंदी में" : "हिंदी में"}",
  "narrationDraft": "बोलने योग्य हिंदी संस्करण",
  "worldSetting": "4-6 वाक्य — काल, स्थापत्य, रंग, प्रकाश, signature detail",
  "titleOptions": ["हिंदी title 1", "हिंदी title 2", "हिंदी title 3"],
  "thumbnailConcepts": ["thumbnail 1 विवरण", "thumbnail 2 विवरण"],
  "musicMood": "संगीत विवरण हिंदी में",
  "scenes": [
    {
      "sequenceNumber": 1,
      "description": "इस scene का कथात्मक उद्देश्य",
      "duration": 5,
      "modelAssigned": "kling-3.0",
      "routingReason": "कारण",
      "cameraDirection": "shot type + movement",
      "visualGuidance": "रंग, मूड, 3-layer background",
      "prompt": "3-5 वाक्य Kling prompt: पात्र+क्रिया, 3-layer environment, camera movement, lighting"
    }
  ]
}

नियम:
- कुल 8-10 scenes, 55-70 सेकंड
- ज़्यादातर scenes 5 सेकंड, establishing shots 10 सेकंड
- मंत्र/श्लोक EXACTLY सही लिखें
- हर scene में worldSetting का reference
- model: "kling-3.0" सभी के लिए`;

    const raw = await generateWithModel(aiModel, systemPrompt, userPrompt, 8192);

    let scriptData: {
      hook: string; fullScript: string; narrationDraft: string;
      worldSetting?: string; titleOptions: string[]; thumbnailConcepts: string[];
      musicMood: string;
      scenes: { sequenceNumber: number; description: string; duration: number; modelAssigned: string; routingReason: string; cameraDirection: string; visualGuidance: string; prompt?: string }[];
    };

    try {
      scriptData = JSON.parse(raw.trim().replace(/^```json\n?|\n?```$/g, ""));
    } catch {
      return NextResponse.json({ error: "AI response parse failed", raw }, { status: 500 });
    }

    const script = await prisma.$transaction(async (tx) => {
      // Create Idea linked to episode
      const idea = await tx.idea.create({
        data: {
          channelId: channel.id,
          title: beat.titleHindi,
          description: beat.summaryHindi,
          type: "series",
          format: "short-form",
          overallScore: 4.5,
          tags: [beat.kanda, "रामायण", "हिंदी", "shorts"],
          status: "ScriptGenerated",
        },
      });

      const newScript = await tx.script.create({
        data: {
          channelId: channel.id,
          ideaId: idea.id,
          title: beat.titleHindi,
          hook: scriptData.hook,
          fullScript: scriptData.fullScript,
          narrationDraft: scriptData.narrationDraft,
          description: scriptData.worldSetting ?? null,
          formatVariant: "Short-form",
          titleOptions: scriptData.titleOptions,
          thumbnailConcepts: scriptData.thumbnailConcepts,
          musicMood: scriptData.musicMood,
          status: "Draft",
        },
      });

      if (scriptData.scenes?.length > 0) {
        await tx.scene.createMany({
          data: scriptData.scenes.map((s) => ({
            scriptId: newScript.id,
            sequenceNumber: s.sequenceNumber,
            description: s.description,
            duration: s.duration,
            modelAssigned: s.modelAssigned,
            routingReason: s.routingReason,
            cameraDirection: s.cameraDirection,
            visualGuidance: s.visualGuidance,
            prompt: s.prompt ?? null,
            characterIds: [],
          })),
        });
      }

      // Link episode to idea and script
      await tx.episode.update({
        where: { id },
        data: { ideaId: idea.id, scriptId: newScript.id, status: "In Production" },
      });

      return newScript;
    });

    const full = await prisma.script.findUnique({
      where: { id: script.id },
      include: { sceneBreakdown: { orderBy: { sequenceNumber: "asc" } } },
    });

    return NextResponse.json(full, { status: 201 });
  } catch (error) {
    console.error("[POST /api/episodes/[id]/generate-script]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

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
आप Kling 1.6 Pro, LTX-Video 2 और Wan 2.1 के लिए cinema-grade AI वीडियो प्रॉम्प्ट लिखते हैं।

VISUAL IDENTITY — हर scene में यही style lock रहेगा:
राजा रवि वर्मा की divine oil painting — animated, cinematic। Treta Yuga ancient India।
कोई modern element नहीं। कोई generic fantasy नहीं। Pure Bharatiya Sanatana Dharma aesthetic।

सभी संवाद, मंत्र और कथा वाल्मीकि रामायण के अनुसार बिल्कुल सही होने चाहिए।
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
एक 4-6 वाक्य का paragraph: काल (Treta Yuga), स्थान, Nagara-style स्थापत्य, dominant color palette, प्रकाश quality, signature visual detail जो इस episode को unique बनाता है।
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CHARACTER DIVINE VISUALS — इन्हें हर scene में exact यही description use करें:
- श्री राम: "blue-luminescent divine skin radiating Vishnu's celestial light, golden silk dhoti with intricate zari work, jewelled Kshatriya crown, sacred janeu thread, golden tilak, divine archer's grace, bare consecrated feet"
- सीता माँ: "golden-wheat complexion radiant as Lakshmi, rich red silk sari with gold border, simple divine ornaments, Sita's smile pure as white lotus, divine feminine grace"
- हनुमान जी: "powerful saffron-tinted divine simian form, vajra-hard body, devotional orange glow, sacred thread, eyes filled with Ram-bhakti tears, gada held reverently"
- लक्ष्मण: "fair golden skin, fierce younger brother's protective stance, quiver of arrows, ever-vigilant devoted eyes"
- रावण: "imposing dark-gold magnificence, Lanka's supreme power, golden crown and armour, shown from behind or profile suggesting ten crowns"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LOCATION COLOR PALETTES — locationTag के अनुसार हर scene में यही palette:
- Ayodhya: "saffron, hammered gold, ivory marble, deep crimson silk"
- Mithila: "marigold festival gold, white marble, celebration colors, lotus pink"
- Dandaka Forest: "emerald green, blue-grey mist, warm amber god-ray shafts, dark earth"
- Panchavati: "golden thatch, lotus pond blue-green reflection, soft dappled forest light"
- Lanka: "dark crimson, molten gold, storm-purple shadows, menacing black"
- Ashoka Vatika: "lush emerald, pale moonlight silver, white jasmine, Sita's gold"
- Kishkindha: "rust-red rock face, forest green, Hanuman saffron, open sky blue"
- Battlefield Lanka: "smoke grey, fire orange, steel blue, blood-crimson sky"
- Ram Setu: "deep sapphire ocean, white bridge stones, golden tropical sunlight, sea spray"
- Mahendra Mountain: "high-altitude grey rock, divine ocean horizon, celestial wind"
- Valmiki Ashram: "forest green, simple earth tones, sage white, peaceful dusk gold"
- Sarayu River: "Ayodhya gold reflecting in clear water, ghats, temple bells haze"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SCENE PROMPT STRUCTURE — हर prompt इस 5-part structure में लिखें:

PART 1 — CHARACTER:
{Name} + {exact divine skin/glow from character guide above} + {exact clothing: fabric+color+zari pattern} + {exact body pose} + {facial expression: divine emotion} + {divine element: aura halo/weapon/sacred gesture}

PART 2 — 3-LAYER ENVIRONMENT:
FOREGROUND: {ground layer 0-1m: flower petals/fire sparks/smoke wisps/dew grass/lotus/silk hem/river ripples — something physically close}
MIDGROUND: {characters here, how divine light falls on them, shadow quality}
BACKGROUND: {architecture/nature/sky} using {location's exact color palette above}

PART 3 — LIGHTING:
Pick one and describe precisely:
• "Volumetric saffron god rays pouring from upper-right through temple stone columns, dust motes visible"
• "Full moon silver-blue divine light, Ram's Vishnu glow creating warm gold rim against cool background"
• "Oil lamp and torch fire-glow, warm reds and golds dancing on stone walls, deep shadow pools"
• "Battle scene: red sky with smoke, fire reflection on armor and weapons, dramatic side-key light"
• "Celestial divine appearance: pure white radiance from above, mortal world cast in golden reverence below"

PART 4 — CAMERA:
{starting position} → {movement type + speed} → {ending composition}
Options:
• "Low reverential angle looking up at Ram, slow devotional push-in, ending tight on divine eyes"
• "Wide Nagara temple establishing shot, crane descend, settle on characters in midground"
• "Over-shoulder Ram looking at scene, slow rack-focus pull to reveal background"
• "High angle birds-eye descending on battlefield, rotating drift, settle on hero"
• "Extreme close-up on divine hand gesture, pull back to reveal full character"

PART 5 — STYLE LOCK (हर single prompt के end में यह EXACTLY लिखें):
"Ravi Varma divine Indian oil painting brought to life, ancient Treta Yuga, cinematic 8K, no modern elements, no western style"

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
      "narrationText": "Narrator का Hindi text — 1-2 वाक्य, भावपूर्ण (character dialogue के बीच की narration)",
      "dialogues": [
        { "character": "Ram", "text": "हे सीते, मैं शीघ्र लौटूंगा।" }
      ],
      "duration": 5,
      "modelAssigned": "ltx-video-2",
      "routingReason": "कारण",
      "cameraDirection": "shot type + movement",
      "visualGuidance": "रंग, मूड, 3-layer background",
      "locationTag": "Ayodhya",
      "prompt": "Full 5-part structured prompt using the SCENE PROMPT STRUCTURE above — 4-6 sentences in English. Must include: character with divine description, 3-layer environment with location color palette, specific lighting, camera movement, style lock.",
      "promptEn": "Structured keyword prompt for LTX2/Wan: '[CHARACTER]: {divine desc}, {clothing} | [SETTING]: {location}, {3 colors}, {architecture} | [FX]: {lighting}, {divine effect} | [CAMERA]: {shot+movement} | Ravi Varma style, Treta Yuga, 8K'"
    }
  ]
}

नियम:
- कुल 8-10 scenes, 55-70 सेकंड
- ज़्यादातर scenes 5 सेकंड, establishing shots 10 सेकंड
- मंत्र/श्लोक EXACTLY सही लिखें — एक भी शब्द न बदलें
- हर scene में worldSetting का reference रखें
- prompt और promptEn दोनों ENGLISH में लिखें
- prompt: 5-part structure MANDATORY — character + 3-layer env + lighting + camera + style lock
- promptEn: pipe-separated structured format — "[CHARACTER]: | [SETTING]: | [FX]: | [CAMERA]: | style"
- हर prompt में "Ravi Varma divine Indian oil painting brought to life, ancient Treta Yuga, cinematic 8K, no modern elements" EXACTLY लिखें
- Character visuals: ऊपर दिए character guide से exact description copy करें — हर scene में consistent
- Location palette: locationTag के अनुसार ऊपर दिए color palette use करें
- modelAssigned routing:
  • "ltx-video-2" — wide establishing shots, landscape, background-heavy scenes, nature
  • "wan-2.1" — mid-shot environment scenes, moderate action, forest/exterior
  • "kling-3.0" — character close-ups, divine appearances, emotional hero shots, key story moments
- locationTag: इनमें से एक: "Ayodhya", "Mithila", "Dandaka Forest", "Panchavati", "Lanka", "Ashoka Vatika", "Kishkindha", "Mahendra Mountain", "Ram Setu", "Battlefield Lanka", "Valmiki Ashram", "Sarayu River"
- narrationText: narrator का Hindi text — character dialogue से अलग, सिर्फ story narration
- dialogues: केवल direct character speech — खाली [] अगर narration-only scene। Exact Valmiki Ramayana के अनुसार।`;

    const raw = await generateWithModel(aiModel, systemPrompt, userPrompt, 8192);

    let scriptData: {
      hook: string; fullScript: string; narrationDraft: string;
      worldSetting?: string; titleOptions: string[]; thumbnailConcepts: string[];
      musicMood: string;
      scenes: { sequenceNumber: number; description: string; narrationText?: string; dialogues?: { character: string; text: string }[]; duration: number; modelAssigned: string; routingReason: string; cameraDirection: string; visualGuidance: string; locationTag?: string; prompt?: string; promptEn?: string }[];
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
            narrationText: s.narrationText ?? null,
            dialogues: s.dialogues ?? [],
            duration: s.duration,
            modelAssigned: s.modelAssigned,
            routingReason: s.routingReason,
            cameraDirection: s.cameraDirection,
            visualGuidance: s.visualGuidance,
            prompt: s.prompt ?? null,
            promptEn: s.promptEn ?? null,
            locationTag: s.locationTag ?? null,
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

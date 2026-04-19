export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// All 27 voices are native Hindi / Indian-language community voices from
// the ElevenLabs Voice Library (confirmed IDs via json2video.com/elevenlabs).
// Use model: eleven_multilingual_v2 when calling TTS for authentic Hindi output.
// Ram, Lakshman, Hanuman already have voices assigned — those are skipped automatically.
const VOICE_MAP: Array<{
  name: string;
  voiceName: string;
  externalVoiceId: string;
  tags: string[];
}> = [
  // ── FEMALE CHARACTERS ────────────────────────────────────────────────────
  {
    name: "Sita",
    voiceName: "Priya (Hindi)",
    externalVoiceId: "amiAXapsDOAiHJqbsAZj",
    tags: ["gentle", "devotional", "sorrowful", "serene"],
  },
  {
    name: "Kaushalya",
    voiceName: "Anjali — Soothing Hindi",
    externalVoiceId: "gHu9GtaHOXcSqFTK06ux",
    tags: ["maternal", "calm", "devout", "dignified"],
  },
  {
    name: "Kaikeyi",
    voiceName: "Natasha — Energetic Hindi",
    externalVoiceId: "DJDkcaY4POaxra3iaZ5b",
    tags: ["proud", "scheming", "passionate", "regal"],
  },
  {
    name: "Shabari",
    voiceName: "Muskaan — Casual Hindi",
    externalVoiceId: "xoV6iGVuOGYHLWjXhVC7",
    tags: ["devoted", "elderly", "joyful", "humble"],
  },
  {
    name: "Mandodari",
    voiceName: "Meera — Conversational Indian",
    externalVoiceId: "gCr8TeSJgJaeaIoV4RWH",
    tags: ["wise", "sorrowful", "dignified", "pleading"],
  },
  {
    name: "Manthara",
    voiceName: "Kanika — Relatable Hindi",
    externalVoiceId: "H6QPv2pQZDcGqLwDTIJQ",
    tags: ["scheming", "rasping", "whispering", "manipulative"],
  },
  {
    name: "Shurpanakha",
    voiceName: "Ayesha — Energetic Hindi",
    externalVoiceId: "hGb0Exk8cp4vQEnwolxa",
    tags: ["seductive", "wrathful", "cunning", "vengeful"],
  },
  {
    name: "Sumitra",
    voiceName: "DB — Indian Hindi",
    externalVoiceId: "2F1KINpxsttim2WfMbVs",
    tags: ["gentle", "serene", "maternal", "composed"],
  },
  {
    name: "Urmila",
    voiceName: "Anika — Sweet Hindi Social Media",
    externalVoiceId: "RABOvaPec1ymXz02oDQi",
    tags: ["devoted", "longing", "patient", "serene"],
  },
  {
    name: "Tara",
    voiceName: "Anika — Hindi Interactive",
    externalVoiceId: "9FTUWXd0yHJL1ZiZ71RK",
    tags: ["grief-stricken", "wise", "queenly", "sorrowful"],
  },

  // ── MALE CHARACTERS ──────────────────────────────────────────────────────
  {
    name: "Ravan",
    voiceName: "Malang — Strong & Confident Hindi",
    externalVoiceId: "PbLyyOzcAbfd6xduq5vt",
    tags: ["commanding", "authoritative", "arrogant", "fierce"],
  },
  {
    name: "Dasharath",
    voiceName: "Ranbir M — Deep Engaging Hindi",
    externalVoiceId: "yRis6UiS4dtT4Aqv72DC",
    tags: ["regal", "paternal", "grieving", "noble"],
  },
  {
    name: "Bharat",
    voiceName: "Ruhaan — Clean Hindi Narration",
    externalVoiceId: "zs7UfyHqCCmny7uTxCYi",
    tags: ["righteous", "grief-stricken", "loyal", "noble"],
  },
  {
    name: "Vibhishan",
    voiceName: "Niraj — Hindi Narrator",
    externalVoiceId: "zgqefOY5FPQ3bB7OZTVR",
    tags: ["righteous", "contemplative", "diplomatic", "firm"],
  },
  {
    name: "Shatrughan",
    voiceName: "Leo — Energetic Hindi",
    externalVoiceId: "IvLWq57RKibBrqZGpQrC",
    tags: ["loyal", "warrior", "steadfast", "brotherly"],
  },
  {
    name: "Vishwamitra",
    voiceName: "Voice of God — Hindi Narration",
    externalVoiceId: "PLFXYRTU74HpuNdj6oDl",
    tags: ["stern", "wise", "commanding", "sage"],
  },
  {
    name: "Sugriva",
    voiceName: "Raju — Relatable Hindi",
    externalVoiceId: "zT03pEAEi0VHKciJODfn",
    tags: ["assertive", "strategic", "grateful", "kingly"],
  },
  {
    name: "Jatayu",
    voiceName: "P K Anil — Clear Hindi",
    externalVoiceId: "JTPrASXyK62cF3L7w8hv",
    tags: ["noble", "heroic", "dying", "honourable"],
  },
  {
    name: "Angad",
    voiceName: "Bunty — Reel Perfect Hindi",
    externalVoiceId: "FZkK3TvQ0pjyDmT8fzIW",
    tags: ["bold", "youthful", "warrior", "fearless"],
  },
  {
    name: "Kumbhakarna",
    voiceName: "Nipunn — Deep Hindi",
    externalVoiceId: "BmblbsReuLUooZ4LL0Rq",
    tags: ["booming", "groggy", "powerful", "resigned"],
  },
  {
    name: "Indrajit",
    voiceName: "Jeet — Raw Unfiltered Hindi",
    externalVoiceId: "3Th96YoTP1kEKxJroYo1",
    tags: ["dark", "proud", "cunning", "fierce"],
  },
  {
    name: "Vashishtha",
    voiceName: "Viraj — Energetic Hindi Narrator",
    externalVoiceId: "FmBhnvP58BK0vz65OOj7",
    tags: ["sagely", "measured", "authoritative", "spiritual"],
  },
  {
    name: "Jambavan",
    voiceName: "Prem — Connectable Hindi",
    externalVoiceId: "sY2peC9GbHX8NCy5enOe",
    tags: ["ancient", "wise", "gravelly", "warm"],
  },
  {
    name: "Maricha",
    voiceName: "Aaditya K — Hindi Storyteller",
    externalVoiceId: "MbS9nsh44HIwAcjGIOe2",
    tags: ["deceptive", "fearful", "cunning", "reluctant"],
  },
  {
    name: "Vali",
    voiceName: "Ahmed — Professional Hindi",
    externalVoiceId: "k7nOSUCadIEwB6fdJmbw",
    tags: ["powerful", "proud", "dying", "kingly"],
  },
  {
    name: "Agastya",
    voiceName: "Parveen — Hindi",
    externalVoiceId: "v4ZRRmjvcrgAdi5qkWtZ",
    tags: ["sage", "powerful", "ancient", "benevolent"],
  },
  {
    name: "Nala",
    voiceName: "Bunty — Funny Best Friend Hindi",
    externalVoiceId: "7b9mYhmnp0y2qSH1FnBL",
    tags: ["skilled", "energetic", "builder", "loyal"],
  },
];

export async function POST(_req: NextRequest) {
  try {
    // Get the first channel
    const channel = await prisma.channel.findFirst();
    if (!channel) {
      return NextResponse.json({ error: "No channel found. Create a channel first." }, { status: 400 });
    }

    const results: Array<{ name: string; status: "created" | "skipped"; reason?: string }> = [];

    for (const entry of VOICE_MAP) {
      // Find the character by name + channelId
      const character = await prisma.character.findFirst({
        where: { name: entry.name, channelId: channel.id },
        select: { id: true, name: true, voiceId: true },
      });

      if (!character) {
        results.push({ name: entry.name, status: "skipped", reason: "character not found in DB" });
        continue;
      }

      if (character.voiceId) {
        results.push({ name: entry.name, status: "skipped", reason: "already has a voice" });
        continue;
      }

      // Create VoiceAsset
      const voice = await prisma.voiceAsset.create({
        data: {
          name: `${entry.name} — ${entry.voiceName}`,
          externalVoiceId: entry.externalVoiceId,
          provider: "elevenlabs",
          channelId: channel.id,
          characterId: character.id,
          language: "Hindi",
          isMultilingual: true,
          tags: entry.tonePresets,
          referenceAudios: [],
        },
      });

      // Link to character
      await prisma.character.update({
        where: { id: character.id },
        data: { voiceId: voice.id },
      });

      results.push({ name: entry.name, status: "created" });
    }

    const created = results.filter((r) => r.status === "created").length;
    const skipped = results.filter((r) => r.status === "skipped").length;

    return NextResponse.json({
      ok: true,
      summary: { created, skipped, total: VOICE_MAP.length },
      results,
    });
  } catch (error) {
    console.error("[seed/ramayana/voices] error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

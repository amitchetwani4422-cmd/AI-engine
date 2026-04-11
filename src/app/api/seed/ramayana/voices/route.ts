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
  elevenlabsVoiceId: string;
  tonePresets: string[];
}> = [
  // ── FEMALE CHARACTERS ────────────────────────────────────────────────────
  {
    name: "Sita",
    voiceName: "Priya (Hindi)",
    elevenlabsVoiceId: "amiAXapsDOAiHJqbsAZj",
    tonePresets: ["gentle", "devotional", "sorrowful", "serene"],
  },
  {
    name: "Kaushalya",
    voiceName: "Anjali — Soothing Hindi",
    elevenlabsVoiceId: "gHu9GtaHOXcSqFTK06ux",
    tonePresets: ["maternal", "calm", "devout", "dignified"],
  },
  {
    name: "Kaikeyi",
    voiceName: "Natasha — Energetic Hindi",
    elevenlabsVoiceId: "DJDkcaY4POaxra3iaZ5b",
    tonePresets: ["proud", "scheming", "passionate", "regal"],
  },
  {
    name: "Shabari",
    voiceName: "Muskaan — Casual Hindi",
    elevenlabsVoiceId: "xoV6iGVuOGYHLWjXhVC7",
    tonePresets: ["devoted", "elderly", "joyful", "humble"],
  },
  {
    name: "Mandodari",
    voiceName: "Meera — Conversational Indian",
    elevenlabsVoiceId: "gCr8TeSJgJaeaIoV4RWH",
    tonePresets: ["wise", "sorrowful", "dignified", "pleading"],
  },
  {
    name: "Manthara",
    voiceName: "Kanika — Relatable Hindi",
    elevenlabsVoiceId: "H6QPv2pQZDcGqLwDTIJQ",
    tonePresets: ["scheming", "rasping", "whispering", "manipulative"],
  },
  {
    name: "Shurpanakha",
    voiceName: "Ayesha — Energetic Hindi",
    elevenlabsVoiceId: "hGb0Exk8cp4vQEnwolxa",
    tonePresets: ["seductive", "wrathful", "cunning", "vengeful"],
  },
  {
    name: "Sumitra",
    voiceName: "DB — Indian Hindi",
    elevenlabsVoiceId: "2F1KINpxsttim2WfMbVs",
    tonePresets: ["gentle", "serene", "maternal", "composed"],
  },
  {
    name: "Urmila",
    voiceName: "Anika — Sweet Hindi Social Media",
    elevenlabsVoiceId: "RABOvaPec1ymXz02oDQi",
    tonePresets: ["devoted", "longing", "patient", "serene"],
  },
  {
    name: "Tara",
    voiceName: "Anika — Hindi Interactive",
    elevenlabsVoiceId: "9FTUWXd0yHJL1ZiZ71RK",
    tonePresets: ["grief-stricken", "wise", "queenly", "sorrowful"],
  },

  // ── MALE CHARACTERS ──────────────────────────────────────────────────────
  {
    name: "Ravan",
    voiceName: "Malang — Strong & Confident Hindi",
    elevenlabsVoiceId: "PbLyyOzcAbfd6xduq5vt",
    tonePresets: ["commanding", "authoritative", "arrogant", "fierce"],
  },
  {
    name: "Dasharath",
    voiceName: "Ranbir M — Deep Engaging Hindi",
    elevenlabsVoiceId: "yRis6UiS4dtT4Aqv72DC",
    tonePresets: ["regal", "paternal", "grieving", "noble"],
  },
  {
    name: "Bharat",
    voiceName: "Ruhaan — Clean Hindi Narration",
    elevenlabsVoiceId: "zs7UfyHqCCmny7uTxCYi",
    tonePresets: ["righteous", "grief-stricken", "loyal", "noble"],
  },
  {
    name: "Vibhishan",
    voiceName: "Niraj — Hindi Narrator",
    elevenlabsVoiceId: "zgqefOY5FPQ3bB7OZTVR",
    tonePresets: ["righteous", "contemplative", "diplomatic", "firm"],
  },
  {
    name: "Shatrughan",
    voiceName: "Leo — Energetic Hindi",
    elevenlabsVoiceId: "IvLWq57RKibBrqZGpQrC",
    tonePresets: ["loyal", "warrior", "steadfast", "brotherly"],
  },
  {
    name: "Vishwamitra",
    voiceName: "Voice of God — Hindi Narration",
    elevenlabsVoiceId: "PLFXYRTU74HpuNdj6oDl",
    tonePresets: ["stern", "wise", "commanding", "sage"],
  },
  {
    name: "Sugriva",
    voiceName: "Raju — Relatable Hindi",
    elevenlabsVoiceId: "zT03pEAEi0VHKciJODfn",
    tonePresets: ["assertive", "strategic", "grateful", "kingly"],
  },
  {
    name: "Jatayu",
    voiceName: "P K Anil — Clear Hindi",
    elevenlabsVoiceId: "JTPrASXyK62cF3L7w8hv",
    tonePresets: ["noble", "heroic", "dying", "honourable"],
  },
  {
    name: "Angad",
    voiceName: "Bunty — Reel Perfect Hindi",
    elevenlabsVoiceId: "FZkK3TvQ0pjyDmT8fzIW",
    tonePresets: ["bold", "youthful", "warrior", "fearless"],
  },
  {
    name: "Kumbhakarna",
    voiceName: "Nipunn — Deep Hindi",
    elevenlabsVoiceId: "BmblbsReuLUooZ4LL0Rq",
    tonePresets: ["booming", "groggy", "powerful", "resigned"],
  },
  {
    name: "Indrajit",
    voiceName: "Jeet — Raw Unfiltered Hindi",
    elevenlabsVoiceId: "3Th96YoTP1kEKxJroYo1",
    tonePresets: ["dark", "proud", "cunning", "fierce"],
  },
  {
    name: "Vashishtha",
    voiceName: "Viraj — Energetic Hindi Narrator",
    elevenlabsVoiceId: "FmBhnvP58BK0vz65OOj7",
    tonePresets: ["sagely", "measured", "authoritative", "spiritual"],
  },
  {
    name: "Jambavan",
    voiceName: "Prem — Connectable Hindi",
    elevenlabsVoiceId: "sY2peC9GbHX8NCy5enOe",
    tonePresets: ["ancient", "wise", "gravelly", "warm"],
  },
  {
    name: "Maricha",
    voiceName: "Aaditya K — Hindi Storyteller",
    elevenlabsVoiceId: "MbS9nsh44HIwAcjGIOe2",
    tonePresets: ["deceptive", "fearful", "cunning", "reluctant"],
  },
  {
    name: "Vali",
    voiceName: "Ahmed — Professional Hindi",
    elevenlabsVoiceId: "k7nOSUCadIEwB6fdJmbw",
    tonePresets: ["powerful", "proud", "dying", "kingly"],
  },
  {
    name: "Agastya",
    voiceName: "Parveen — Hindi",
    elevenlabsVoiceId: "v4ZRRmjvcrgAdi5qkWtZ",
    tonePresets: ["sage", "powerful", "ancient", "benevolent"],
  },
  {
    name: "Nala",
    voiceName: "Bunty — Funny Best Friend Hindi",
    elevenlabsVoiceId: "7b9mYhmnp0y2qSH1FnBL",
    tonePresets: ["skilled", "energetic", "builder", "loyal"],
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
          elevenlabsVoiceId: entry.elevenlabsVoiceId,
          channelId: channel.id,
          characterId: character.id,
          language: "Hindi",
          isMultilingual: true,
          tonePresets: entry.tonePresets,
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

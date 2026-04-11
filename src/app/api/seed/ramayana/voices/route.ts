export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ElevenLabs pre-made voice assignments for Ramayana characters
// Ram, Lakshman, Hanuman already have voices — skip them
const VOICE_MAP: Array<{
  name: string;
  voiceName: string;
  elevenlabsVoiceId: string;
  tonePresets: string[];
}> = [
  {
    name: "Sita",
    voiceName: "Rachel",
    elevenlabsVoiceId: "21m00Tcm4TlvDq8ikWAM",
    tonePresets: ["gentle", "devotional", "sorrowful", "serene"],
  },
  {
    name: "Ravan",
    voiceName: "Daniel",
    elevenlabsVoiceId: "onwK4e9ZLuTAKqWW03F9",
    tonePresets: ["commanding", "authoritative", "arrogant", "fierce"],
  },
  {
    name: "Dasharath",
    voiceName: "George",
    elevenlabsVoiceId: "CwhRBWXzGAHq8TQ4Fs17",
    tonePresets: ["regal", "paternal", "grieving", "noble"],
  },
  {
    name: "Kaushalya",
    voiceName: "Bella",
    elevenlabsVoiceId: "EXAVITQu4vr4xnSDxMaL",
    tonePresets: ["maternal", "calm", "devout", "dignified"],
  },
  {
    name: "Kaikeyi",
    voiceName: "Domi",
    elevenlabsVoiceId: "AZnzlk1XvdvUeBnXmlld",
    tonePresets: ["proud", "scheming", "passionate", "regal"],
  },
  {
    name: "Bharat",
    voiceName: "Antoni",
    elevenlabsVoiceId: "ErXwobaYiN019PkySvjV",
    tonePresets: ["righteous", "grief-stricken", "loyal", "noble"],
  },
  {
    name: "Vibhishan",
    voiceName: "James",
    elevenlabsVoiceId: "ZQe5CZNOzWyzPSCn5a3c",
    tonePresets: ["righteous", "contemplative", "diplomatic", "firm"],
  },
  {
    name: "Shatrughan",
    voiceName: "Liam",
    elevenlabsVoiceId: "TX3LPaxmHKxFdv7VOQHJ",
    tonePresets: ["loyal", "warrior", "steadfast", "brotherly"],
  },
  {
    name: "Vishwamitra",
    voiceName: "Arnold",
    elevenlabsVoiceId: "VR6AewLTigWG4xSOukaG",
    tonePresets: ["stern", "wise", "commanding", "sage"],
  },
  {
    name: "Sugriva",
    voiceName: "Brian",
    elevenlabsVoiceId: "nPczCjzI2devNBz1zQrb",
    tonePresets: ["assertive", "strategic", "grateful", "kingly"],
  },
  {
    name: "Jatayu",
    voiceName: "Adam",
    elevenlabsVoiceId: "pNInz6obpgDQGcFmaJgB",
    tonePresets: ["noble", "heroic", "dying", "honourable"],
  },
  {
    name: "Shabari",
    voiceName: "Dorothy",
    elevenlabsVoiceId: "ThT5KcBeYPX3keUQqHPh",
    tonePresets: ["devoted", "elderly", "joyful", "humble"],
  },
  {
    name: "Angad",
    voiceName: "Sam",
    elevenlabsVoiceId: "yoZ06aMxZJJ28mfd3POQ",
    tonePresets: ["bold", "youthful", "warrior", "fearless"],
  },
  {
    name: "Kumbhakarna",
    voiceName: "Josh",
    elevenlabsVoiceId: "TxGEqnHWrfWFTfGW9XjX",
    tonePresets: ["booming", "groggy", "powerful", "resigned"],
  },
  {
    name: "Indrajit",
    voiceName: "Harry",
    elevenlabsVoiceId: "SOYHLrjzK2X1ezoPC6cr",
    tonePresets: ["dark", "proud", "cunning", "fierce"],
  },
  {
    name: "Mandodari",
    voiceName: "Charlotte",
    elevenlabsVoiceId: "XB0fDUnXU5powFXDhCwa",
    tonePresets: ["wise", "sorrowful", "dignified", "pleading"],
  },
  {
    name: "Manthara",
    voiceName: "Jessie",
    elevenlabsVoiceId: "t0jbNlBVZ17f02VDIeMI",
    tonePresets: ["scheming", "rasping", "whispering", "manipulative"],
  },
  {
    name: "Vashishtha",
    voiceName: "Callum",
    elevenlabsVoiceId: "N2lVS1w4EtoT3dr4eOWO",
    tonePresets: ["sagely", "measured", "authoritative", "spiritual"],
  },
  {
    name: "Jambavan",
    voiceName: "Patrick",
    elevenlabsVoiceId: "ODq5zmih8GrVes37Dy39",
    tonePresets: ["ancient", "wise", "gravelly", "warm"],
  },
  {
    name: "Shurpanakha",
    voiceName: "Freya",
    elevenlabsVoiceId: "jsCqWAovK2LkecY7zXl4",
    tonePresets: ["seductive", "wrathful", "cunning", "vengeful"],
  },
  {
    name: "Maricha",
    voiceName: "Charlie",
    elevenlabsVoiceId: "IKne3meq5aSn9XLyUdCD",
    tonePresets: ["deceptive", "fearful", "cunning", "reluctant"],
  },
  {
    name: "Sumitra",
    voiceName: "Matilda",
    elevenlabsVoiceId: "XrExE9yKIg1WjnnlVkGX",
    tonePresets: ["gentle", "serene", "maternal", "composed"],
  },
  {
    name: "Vali",
    voiceName: "Eric",
    elevenlabsVoiceId: "cjVigY5qzO86Huf0OWal",
    tonePresets: ["powerful", "proud", "dying", "kingly"],
  },
  {
    name: "Urmila",
    voiceName: "Gigi",
    elevenlabsVoiceId: "jBpfuIE2acCO8z3wKNLl",
    tonePresets: ["devoted", "longing", "patient", "serene"],
  },
  {
    name: "Agastya",
    voiceName: "Chris",
    elevenlabsVoiceId: "iP05astWwhQ2gGYjsEVp",
    tonePresets: ["sage", "powerful", "ancient", "benevolent"],
  },
  {
    name: "Nala",
    voiceName: "Fin",
    elevenlabsVoiceId: "D38z5RcWu1voky8WS1ja",
    tonePresets: ["skilled", "energetic", "builder", "loyal"],
  },
  {
    name: "Tara",
    voiceName: "Elli",
    elevenlabsVoiceId: "MF3mGyEYCl7XYWbV9V6O",
    tonePresets: ["grief-stricken", "wise", "queenly", "sorrowful"],
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

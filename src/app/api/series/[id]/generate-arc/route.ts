export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { generateWithModel, DEFAULT_IDEA_MODEL } from "@/lib/ai-provider";
import type { AIModel } from "@/lib/ai-provider";
import {
  RAMAYANA_KANDAS,
  RAMAYANA_KNOWLEDGE_BASE,
  getKandaKnowledge,
  type RamayanaKandaName,
} from "@/lib/mythology-knowledge";

const GenerateArcSchema = z.object({
  kandaName: z.enum(RAMAYANA_KANDAS as [RamayanaKandaName, ...RamayanaKandaName[]]),
  episodeCount: z.number().int().min(1).max(20),
  aiModel: z.string().optional(),
});

interface GeneratedArcEpisode {
  episodeNumber: number;
  title: string;
  summary: string;
  keyStoryBeats: string[];
  mantra: {
    sanskrit: string;
    transliteration: string;
    meaning: string;
  };
  tags: string[];
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = GenerateArcSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { kandaName, episodeCount, aiModel } = parsed.data;
    const model = (aiModel ?? DEFAULT_IDEA_MODEL) as AIModel;

    const series = await prisma.series.findUnique({
      where: { id },
      include: {
        channel: { select: { id: true, name: true, niche: true, language: true } },
        episodes: {
          orderBy: { episodeNumber: "desc" },
          take: 1,
          select: { episodeNumber: true },
        },
      },
    });

    if (!series) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 });
    }

    const kanda = getKandaKnowledge(kandaName);
    if (!kanda) {
      return NextResponse.json({ error: "Unknown Kanda" }, { status: 400 });
    }

    const startEpisode = (series.episodes[0]?.episodeNumber ?? 0) + 1;

    const systemPrompt = `You are a Ramayana canon consultant and screenplay architect.
Always return valid JSON only, no markdown.
Preserve chronology and devotional tone with high factual fidelity.`;

    const userPrompt = `Create ${episodeCount} Ramayana episodes for this series arc.

Series: ${series.name}
Channel: ${series.channel.name}
Language: ${series.channel.language}
Niche: ${series.channel.niche}
Target Kanda: ${kanda.name}
Start numbering from: ${startEpisode}

KANDA SUMMARY:
${kanda.summary}

MANDATORY THEMES:
${kanda.mustIncludeThemes.map((theme) => `- ${theme}`).join("\n")}

SEED EPISODES (adapt as needed):
${kanda.episodeSeeds
  .map(
    (seed, idx) =>
      `${idx + 1}. ${seed.title} — ${seed.beat} (mantraFocus: ${seed.mantraFocus})`
  )
  .join("\n")}

CHARACTER VISUAL CONSISTENCY:
${RAMAYANA_KNOWLEDGE_BASE.characterProfiles
  .map(
    (profile) =>
      `- ${profile.name}: ${profile.visualDescription}. Prompt rule: ${profile.promptBlock}`
  )
  .join("\n")}

GLOBAL ACCURACY RULES:
${RAMAYANA_KNOWLEDGE_BASE.globalAccuracyRules.map((rule) => `- ${rule}`).join("\n")}

FORBIDDEN MISTAKES:
${RAMAYANA_KNOWLEDGE_BASE.forbiddenMistakes.map((rule) => `- ${rule}`).join("\n")}

MANTRAS TO USE (choose one per episode):
${kanda.recommendedMantras
  .map(
    (mantra) =>
      `- ${mantra.id}: ${mantra.sanskrit} | ${mantra.transliteration} | ${mantra.translation}`
  )
  .join("\n")}

Return this JSON format:
{
  "episodes": [
    {
      "episodeNumber": ${startEpisode},
      "title": "Episode title",
      "summary": "2-4 sentence devotional yet cinematic summary",
      "keyStoryBeats": ["beat 1", "beat 2", "beat 3"],
      "mantra": {
        "sanskrit": "...",
        "transliteration": "...",
        "meaning": "..."
      },
      "tags": ["ramayana", "${kandaName.toLowerCase()}", "mythology"]
    }
  ]
}

Rules:
1) Episode numbers must be sequential from ${startEpisode}.
2) Stick ONLY to ${kandaName} events; no cross-kanda spoilers unless in ending teaser.
3) Every summary must include at least one named canonical character.
4) Every mantra must be copied accurately from provided list.
5) Tags must include ramayana, mythology, and ${kandaName.toLowerCase()}.`;

    const raw = await generateWithModel(model, systemPrompt, userPrompt, 8192);

    let generated: { episodes: GeneratedArcEpisode[] };
    try {
      const json = raw.trim().replace(/^```json\n?|\n?```$/g, "");
      generated = JSON.parse(json);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI output", raw }, { status: 500 });
    }

    const episodes = Array.isArray(generated.episodes) ? generated.episodes.slice(0, episodeCount) : [];
    if (episodes.length === 0) {
      return NextResponse.json({ error: "AI returned no episodes", raw }, { status: 500 });
    }

    const created = await prisma.$transaction(async (tx) => {
      const createdRows = [] as Array<{ ideaId: string; episodeId: string; title: string; episodeNumber: number }>;

      for (const ep of episodes) {
        const cleanTitle = ep.title?.trim() || `Episode ${ep.episodeNumber}`;
        const cleanSummary = ep.summary?.trim() || "";
        const tags = Array.from(new Set(["ramayana", "mythology", kandaName.toLowerCase(), ...(ep.tags ?? [])]));

        const idea = await tx.idea.create({
          data: {
            channelId: series.channelId,
            title: cleanTitle,
            description: `${cleanSummary}\n\nStory Beats: ${(ep.keyStoryBeats ?? []).join(" | ")}\nMantra: ${ep.mantra?.sanskrit ?? ""}`,
            type: "series",
            format: "episodic",
            tags,
            status: "Approved",
          },
        });

        const episode = await tx.episode.create({
          data: {
            seriesId: series.id,
            episodeNumber: ep.episodeNumber,
            title: cleanTitle,
            summary: cleanSummary,
            status: "Planned",
            characterArcs: {
              kanda: kandaName,
              storyBeats: ep.keyStoryBeats ?? [],
              mantra: ep.mantra,
              accuracyCheckpoint: "Validated against Ramayana knowledge rules",
              linkedIdeaId: idea.id,
            },
          },
        });

        createdRows.push({
          ideaId: idea.id,
          episodeId: episode.id,
          title: cleanTitle,
          episodeNumber: ep.episodeNumber,
        });
      }

      return createdRows;
    });

    return NextResponse.json(
      {
        seriesId: series.id,
        kandaName,
        createdCount: created.length,
        episodes: created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/series/[id]/generate-arc error:", error);
    return NextResponse.json({ error: "Failed to generate arc" }, { status: 500 });
  }
}

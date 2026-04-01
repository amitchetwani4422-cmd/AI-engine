import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const schema = z.object({
  channelId: z.string().min(1),
  count: z.number().int().min(1).max(20).default(5),
  type: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }
    const { channelId, count, type } = parsed.data;

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        ideas: { orderBy: { createdAt: "desc" }, take: 5, select: { title: true } },
      },
    });
    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const recentTitles = channel.ideas.map((i) => i.title).join("\n- ");
    const prompt = `Generate ${count} unique video content ideas for this YouTube/Instagram channel.

Channel: ${channel.name}
Niche: ${channel.niche}
Universe: ${channel.universe}
Target Audience: ${channel.targetAudience}
Platform: ${channel.primaryPlatform}
Language: ${channel.language}
Content Pillars: ${channel.contentPillars.join(", ")}
${type ? `Focus Type: ${type}` : ""}
Avoid duplicating: ${recentTitles || "none yet"}

Return ONLY a JSON array (no markdown) like:
[
  {
    "title": "Compelling video title",
    "description": "2-3 sentence concept description",
    "type": "topic",
    "format": "long-form",
    "channelFitScore": 4.2,
    "noveltyScore": 3.8,
    "repeatabilityScore": 4.0,
    "productionDifficulty": 3.0,
    "estimatedCost": 5.0,
    "monetizationScore": 4.5,
    "overallScore": 4.0,
    "tags": ["tag1", "tag2"]
  }
]`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const rawContent = message.content[0].type === "text" ? message.content[0].text : "[]";
    let ideas: Array<Record<string, unknown>>;
    try {
      const jsonStr = rawContent.trim().replace(/^```json\n?|\n?```$/g, "");
      const parsed = JSON.parse(jsonStr);
      ideas = Array.isArray(parsed) ? parsed : parsed.ideas ?? [];
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response", raw: rawContent }, { status: 500 });
    }

    const created = await Promise.all(
      ideas.slice(0, count).map((idea) =>
        prisma.idea.create({
          data: {
            channelId,
            title: String(idea.title ?? "Untitled"),
            description: String(idea.description ?? ""),
            type: String(idea.type ?? type ?? "topic"),
            format: String(idea.format ?? "long-form"),
            channelFitScore: Number(idea.channelFitScore ?? 0),
            noveltyScore: Number(idea.noveltyScore ?? 0),
            repeatabilityScore: Number(idea.repeatabilityScore ?? 0),
            productionDifficulty: Number(idea.productionDifficulty ?? 0),
            estimatedCost: Number(idea.estimatedCost ?? 0),
            monetizationScore: Number(idea.monetizationScore ?? 0),
            overallScore: Number(idea.overallScore ?? 0),
            tags: Array.isArray(idea.tags) ? (idea.tags as string[]) : [],
            status: "Draft",
          },
        })
      )
    );

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("[ideas/generate POST]", error);
    return NextResponse.json({ error: "Failed to generate ideas" }, { status: 500 });
  }
}

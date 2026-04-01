export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateWithModel, DEFAULT_IDEA_MODEL } from "@/lib/ai-provider";
import type { AIModel } from "@/lib/ai-provider";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const model = (body.aiModel ?? DEFAULT_IDEA_MODEL) as AIModel;

    const idea = await prisma.idea.findUnique({
      where: { id },
      include: { channel: true },
    });

    if (!idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    const systemPrompt = `You are an expert content analyst who scores video ideas for AI content channels.
Score ideas objectively based on platform performance data and content strategy principles.
Always respond with valid JSON only, no markdown, no commentary.`;

    const userPrompt = `Score this video idea on a scale of 0-10 for each dimension:

Idea Title: ${idea.title}
Description: ${idea.description}
Type: ${idea.type}
Format: ${idea.format}
Platform: ${idea.channel.primaryPlatform}
Niche: ${idea.channel.niche}
Target Audience: ${idea.channel.targetAudience}

Return JSON with this exact structure:
{
  "channelFitScore": 8.5,
  "noveltyScore": 7.0,
  "repeatabilityScore": 6.5,
  "productionDifficulty": 4.0,
  "estimatedCost": 5.0,
  "monetizationScore": 7.5,
  "overallScore": 7.3,
  "reasoning": "Brief explanation of the scores",
  "status": "Approved"
}

Status must be one of: Approved, Rejected, Draft`;

    const rawContent = await generateWithModel(model, systemPrompt, userPrompt, 1024);

    let scores: {
      channelFitScore: number;
      noveltyScore: number;
      repeatabilityScore: number;
      productionDifficulty: number;
      estimatedCost: number;
      monetizationScore: number;
      overallScore: number;
      reasoning: string;
      status: string;
    };

    try {
      const jsonStr = rawContent.trim().replace(/^```json\n?|\n?```$/g, '');
      scores = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI scoring response', raw: rawContent },
        { status: 500 }
      );
    }

    const updatedIdea = await prisma.idea.update({
      where: { id },
      data: {
        channelFitScore: scores.channelFitScore,
        noveltyScore: scores.noveltyScore,
        repeatabilityScore: scores.repeatabilityScore,
        productionDifficulty: scores.productionDifficulty,
        estimatedCost: scores.estimatedCost,
        monetizationScore: scores.monetizationScore,
        overallScore: scores.overallScore,
        notes: scores.reasoning,
        status: ['Approved', 'Rejected', 'Draft'].includes(scores.status) ? scores.status : 'Draft',
      },
    });

    return NextResponse.json(updatedIdea);
  } catch (error) {
    console.error('POST /api/ideas/[id]/score error:', error);
    return NextResponse.json({ error: 'Failed to score idea' }, { status: 500 });
  }
}

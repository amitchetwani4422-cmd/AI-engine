import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import anthropic from '@/lib/anthropic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const idea = await prisma.idea.findUnique({
      where: { id },
      include: {
        channel: true,
      },
    });

    if (!idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    const systemPrompt = `You are an expert content analyst who scores video ideas for virality and production quality.
Score ideas objectively based on platform performance data and content strategy principles.
Always respond with valid JSON only.`;

    const userPrompt = `Score this video idea on a scale of 1-10 for each dimension:

Idea Title: ${idea.title}
Description: ${idea.description ?? 'Not provided'}
Type: ${idea.type ?? 'Not specified'}
Hook: ${idea.hook ?? 'Not provided'}
Target Emotion: ${idea.targetEmotion ?? 'Not specified'}
Platform: ${idea.channel.primaryPlatform}
Niche: ${idea.channel.niche}
Target Audience: ${idea.channel.targetAudience}

Return JSON with this exact structure:
{
  "viralityScore": 8,
  "productionComplexityScore": 5,
  "audienceAlignmentScore": 9,
  "uniquenessScore": 7,
  "trendRelevanceScore": 6,
  "overallScore": 7.5,
  "reasoning": "Brief explanation of scores",
  "improvementSuggestions": ["Suggestion 1", "Suggestion 2"],
  "recommendApproval": true
}`;

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const rawContent =
      message.content[0].type === 'text' ? message.content[0].text : '';

    let scores: {
      viralityScore: number;
      productionComplexityScore: number;
      audienceAlignmentScore: number;
      uniquenessScore: number;
      trendRelevanceScore: number;
      overallScore: number;
      reasoning: string;
      improvementSuggestions: string[];
      recommendApproval: boolean;
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

    // Upsert the score record
    const ideaScore = await prisma.ideaScore.upsert({
      where: { ideaId: id },
      update: {
        viralityScore: scores.viralityScore,
        productionComplexityScore: scores.productionComplexityScore,
        audienceAlignmentScore: scores.audienceAlignmentScore,
        uniquenessScore: scores.uniquenessScore,
        trendRelevanceScore: scores.trendRelevanceScore,
        overallScore: scores.overallScore,
        reasoning: scores.reasoning,
        improvementSuggestions: scores.improvementSuggestions,
        recommendApproval: scores.recommendApproval,
        scoredAt: new Date(),
      },
      create: {
        ideaId: id,
        viralityScore: scores.viralityScore,
        productionComplexityScore: scores.productionComplexityScore,
        audienceAlignmentScore: scores.audienceAlignmentScore,
        uniquenessScore: scores.uniquenessScore,
        trendRelevanceScore: scores.trendRelevanceScore,
        overallScore: scores.overallScore,
        reasoning: scores.reasoning,
        improvementSuggestions: scores.improvementSuggestions,
        recommendApproval: scores.recommendApproval,
        scoredAt: new Date(),
      },
    });

    // Update idea status if score is high enough
    if (scores.recommendApproval && scores.overallScore >= 7) {
      await prisma.idea.update({
        where: { id },
        data: { status: 'Scored' },
      });
    }

    const updatedIdea = await prisma.idea.findUnique({
      where: { id },
      include: {
        scores: true,
        channel: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updatedIdea);
  } catch (error) {
    console.error('POST /api/ideas/[id]/score error:', error);
    return NextResponse.json(
      { error: 'Failed to score idea' },
      { status: 500 }
    );
  }
}

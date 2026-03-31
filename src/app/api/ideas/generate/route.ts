import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import anthropic from '@/lib/anthropic';

const GenerateIdeasSchema = z.object({
  channelId: z.string().min(1),
  count: z.number().int().min(1).max(20).default(5),
  type: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = GenerateIdeasSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { channelId, count, type } = parsed.data;

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        styleBible: true,
        ideas: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { title: true, type: true },
        },
      },
    });

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const recentTitles = channel.ideas.map((i) => i.title).join('\n- ');

    const systemPrompt = `You are a creative content strategist specializing in AI-generated video content for ${channel.primaryPlatform}.
You generate compelling, viral-worthy video ideas tailored to a channel's specific niche and audience.
Always respond with valid JSON only, no markdown, no commentary.`;

    const userPrompt = `Generate ${count} unique video content ideas for this channel:

Channel: ${channel.name}
Niche: ${channel.niche}
Universe/Theme: ${channel.universe ?? 'Not specified'}
Target Audience: ${channel.targetAudience}
Platform: ${channel.primaryPlatform}
Language: ${channel.language}
Content Pillars: ${(channel.contentPillars as string[]).join(', ')}
${type ? `Content Type: ${type}` : ''}

Recent ideas (avoid duplicating these):
- ${recentTitles || 'None yet'}

Return a JSON array of exactly ${count} idea objects with this structure:
{
  "ideas": [
    {
      "title": "Compelling video title",
      "description": "2-3 sentence description of the video concept",
      "type": "${type ?? 'one of: Educational, Entertainment, Story, Tutorial, Trend, Emotional'}",
      "hook": "Opening hook line that grabs attention in first 3 seconds",
      "targetEmotion": "Primary emotion to evoke (curiosity/surprise/inspiration/humor/nostalgia)",
      "estimatedDuration": 60,
      "tags": ["tag1", "tag2", "tag3"]
    }
  ]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const rawContent =
      message.content[0].type === 'text' ? message.content[0].text : '';

    let parsedIdeas: Array<{
      title: string;
      description?: string;
      type?: string;
      hook?: string;
      targetEmotion?: string;
      estimatedDuration?: number;
      tags?: string[];
    }>;

    try {
      const jsonStr = rawContent.trim().replace(/^```json\n?|\n?```$/g, '');
      const parsed = JSON.parse(jsonStr);
      parsedIdeas = parsed.ideas ?? parsed;
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response', raw: rawContent },
        { status: 500 }
      );
    }

    const createdIdeas = await Promise.all(
      parsedIdeas.slice(0, count).map((idea) =>
        prisma.idea.create({
          data: {
            channelId,
            title: idea.title,
            description: idea.description ?? null,
            type: idea.type ?? type ?? null,
            hook: idea.hook ?? null,
            targetEmotion: idea.targetEmotion ?? null,
            estimatedDuration: idea.estimatedDuration ?? null,
            tags: idea.tags ?? [],
            status: 'Draft',
            source: 'AI',
          },
          include: {
            channel: { select: { id: true, name: true } },
          },
        })
      )
    );

    return NextResponse.json(
      { ideas: createdIdeas, count: createdIdeas.length },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/ideas/generate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate ideas' },
      { status: 500 }
    );
  }
}

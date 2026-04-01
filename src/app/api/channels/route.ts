export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const CreateChannelSchema = z.object({
  name: z.string().min(1),
  niche: z.string().min(1),
  universe: z.string().optional(),
  targetAudience: z.string().min(1),
  primaryPlatform: z.string().min(1),
  language: z.string().min(1),
  postingFrequency: z.string().optional(),
  contentPillars: z.array(z.string()).optional(),
  formatStrategy: z.string().optional(),
  defaultModelPref: z.string().optional(),
  maxBudgetPerVideo: z.number().optional(),
  maxBudgetPerWeek: z.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const channels = await prisma.channel.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            ideas: true,
            videos: true,
          },
        },
        videos: {
          select: {
            id: true,
            status: true,
            klingCost: true,
            veoCost: true,
            analytics: {
              select: {
                views: true,
                watchTimeHours: true,
                classification: true,
              },
            },
          },
        },
      },
    });

    const channelsWithSummary = channels.map((channel) => {
      const publishedVideos = channel.videos.filter(
        (v) => v.status === 'Published'
      );
      const totalViews = publishedVideos.reduce((sum, v) => {
        return (
          sum +
          v.analytics.reduce((aSum, a) => aSum + (a.views ?? 0), 0)
        );
      }, 0);
      const totalCost = channel.videos.reduce(
        (sum, v) => sum + (v.klingCost ?? 0) + (v.veoCost ?? 0),
        0
      );
      const winnerCount = publishedVideos.filter((v) =>
        v.analytics.some((a) => a.classification === 'Winner')
      ).length;

      return {
        ...channel,
        videos: undefined,
        analyticsSummary: {
          totalVideos: channel._count.videos,
          totalIdeas: channel._count.ideas,
          publishedVideos: publishedVideos.length,
          totalViews,
          totalCost: parseFloat(totalCost.toFixed(4)),
          winnerCount,
        },
      };
    });

    return NextResponse.json(channelsWithSummary);
  } catch (error) {
    console.error('GET /api/channels error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channels' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateChannelSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const channel = await prisma.channel.create({
      data: {
        name: data.name,
        niche: data.niche,
        universe: data.universe ?? null,
        targetAudience: data.targetAudience,
        primaryPlatform: data.primaryPlatform,
        language: data.language,
        postingFrequency: data.postingFrequency ?? null,
        contentPillars: data.contentPillars ?? [],
        formatStrategy: data.formatStrategy ?? null,
        defaultModelPref: data.defaultModelPref ?? null,
        maxBudgetPerVideo: data.maxBudgetPerVideo ?? null,
        maxBudgetPerWeek: data.maxBudgetPerWeek ?? null,
      },
    });

    return NextResponse.json(channel, { status: 201 });
  } catch (error) {
    console.error('POST /api/channels error:', error);
    return NextResponse.json(
      { error: 'Failed to create channel' },
      { status: 500 }
    );
  }
}

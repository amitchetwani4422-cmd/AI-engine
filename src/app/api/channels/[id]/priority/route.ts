import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const channel = await prisma.channel.findUnique({
      where: { id },
      include: {
        videos: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            analytics: true,
          },
        },
        ideas: {
          where: { status: { in: ['Draft', 'Approved'] } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { videos: true, ideas: true },
        },
      },
    });

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const publishedVideos = channel.videos.filter(
      (v) => v.status === 'Published'
    );
    const recentVideos = publishedVideos.slice(0, 5);
    const olderVideos = publishedVideos.slice(5, 10);

    // Check output drop (pause candidate)
    const recentAvgViews =
      recentVideos.length > 0
        ? recentVideos.reduce(
            (sum, v) =>
              sum + v.analytics.reduce((a, an) => a + (an.views ?? 0), 0),
            0
          ) / recentVideos.length
        : 0;
    const olderAvgViews =
      olderVideos.length > 0
        ? olderVideos.reduce(
            (sum, v) =>
              sum + v.analytics.reduce((a, an) => a + (an.views ?? 0), 0),
            0
          ) / olderVideos.length
        : 0;
    const outputDropped =
      olderAvgViews > 0 && recentAvgViews < olderAvgViews * 0.5;

    // Check winner formats
    const winnerVideos = publishedVideos.filter((v) =>
      v.analytics.some((a) => a.classification === 'Winner')
    );
    const loserVideos = publishedVideos.filter((v) =>
      v.analytics.some((a) => a.classification === 'Loser')
    );
    const inconclusiveVideos = publishedVideos.filter((v) =>
      v.analytics.some((a) => a.classification === 'Inconclusive')
    );
    const hasWinnerFormats = winnerVideos.length > 0;

    // Monetization progress (approximate thresholds for YouTube)
    const totalViews = publishedVideos.reduce(
      (sum, v) =>
        sum + v.analytics.reduce((a, an) => a + (an.views ?? 0), 0),
      0
    );
    const totalWatchHours = publishedVideos.reduce(
      (sum, v) =>
        sum +
        v.analytics.reduce(
          (a, an) => a + (an.watchTimeSeconds ?? 0) / 3600,
          0
        ),
      0
    );
    const monetizationProgress = {
      subscribersNeeded: 1000,
      watchHoursNeeded: 4000,
      currentWatchHours: Math.round(totalWatchHours),
      watchHoursProgress: Math.min(
        100,
        Math.round((totalWatchHours / 4000) * 100)
      ),
    };

    // Score calculation
    let priorityScore = 50;
    const recommendedActions: string[] = [];

    if (outputDropped) {
      priorityScore -= 20;
      recommendedActions.push(
        'Output has dropped significantly — review content quality or pause and reassess strategy.'
      );
    }

    if (hasWinnerFormats) {
      priorityScore += 20;
      recommendedActions.push(
        `${winnerVideos.length} winner format(s) identified — prioritize replicating these formats.`
      );
    }

    if (loserVideos.length > winnerVideos.length * 2) {
      priorityScore -= 15;
      recommendedActions.push(
        'High loser ratio — experiment with new formats and topics before scaling.'
      );
    }

    if (monetizationProgress.watchHoursProgress >= 75) {
      priorityScore += 10;
      recommendedActions.push(
        `Close to monetization threshold (${monetizationProgress.watchHoursProgress}% watch hours) — increase posting frequency.`
      );
    }

    if (channel._count.ideas < 5) {
      priorityScore -= 5;
      recommendedActions.push(
        'Low idea pipeline — generate more ideas to keep content flow active.'
      );
    }

    if (publishedVideos.length === 0) {
      recommendedActions.push(
        'No published videos yet — approve and produce first content.'
      );
    }

    const isPauseCandidate = outputDropped && loserVideos.length > 3;
    if (isPauseCandidate) {
      recommendedActions.push(
        'Consider pausing this channel for strategic review.'
      );
    }

    // Clamp score 0-100
    priorityScore = Math.max(0, Math.min(100, priorityScore));

    return NextResponse.json({
      channelId: id,
      channelName: channel.name,
      priorityScore,
      isPauseCandidate,
      hasWinnerFormats,
      outputDropped,
      stats: {
        totalPublishedVideos: publishedVideos.length,
        winnerCount: winnerVideos.length,
        loserCount: loserVideos.length,
        inconclusiveCount: inconclusiveVideos.length,
        totalViews,
        recentAvgViews: Math.round(recentAvgViews),
        olderAvgViews: Math.round(olderAvgViews),
      },
      monetizationProgress,
      recommendedActions,
    });
  } catch (error) {
    console.error('GET /api/channels/[id]/priority error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate priority' },
      { status: 500 }
    );
  }
}

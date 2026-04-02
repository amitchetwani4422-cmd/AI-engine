import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const channelId = req.nextUrl.searchParams.get("channelId");

    const channelWhere = channelId ? { id: channelId } : {};
    const videoWhere = channelId ? { channelId } : {};

    const [channels, videos, analytics, channelAnalytics] = await Promise.all([
      prisma.channel.findMany({ where: channelWhere }),
      prisma.video.findMany({
        where: { ...videoWhere, status: "Published" },
        include: { analytics: true },
        orderBy: { publishedAt: "desc" },
        take: 50,
      }),
      prisma.videoAnalytics.findMany({
        where: channelId ? { channelId } : {},
        orderBy: { recordedAt: "desc" },
      }),
      prisma.channelAnalytics.findMany({
        where: channelId ? { channelId } : {},
        orderBy: { recordedAt: "desc" },
        take: channelId ? 1 : 10,
      }),
    ]);

    // Aggregate cost metrics
    const totalKlingCost = videos.reduce((sum, v) => sum + v.klingCost, 0);
    const totalVeoCost = videos.reduce((sum, v) => sum + v.veoCost, 0);
    const totalCost = videos.reduce((sum, v) => sum + v.totalCost, 0);

    // Classification counts
    const classificationCounts = analytics.reduce(
      (acc, a) => {
        const key = a.classification ?? "Inconclusive";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Monetization progress per channel
    const monetizationProgress = channels.map((ch) => {
      const earlyAccessSubs = Math.min(
        (ch.subscriberCount / 500) * 100,
        100
      );
      const fullRevSubs = Math.min(
        (ch.subscriberCount / 1000) * 100,
        100
      );
      const watchHoursProgress = Math.min(
        (ch.watchHoursTotal / 4000) * 100,
        100
      );
      const shortsProgress = Math.min(
        (ch.shortsViewsTotal / 10000000) * 100,
        100
      );
      return {
        channelId: ch.id,
        channelName: ch.name,
        subscriberCount: ch.subscriberCount,
        watchHoursTotal: ch.watchHoursTotal,
        shortsViewsTotal: ch.shortsViewsTotal,
        earlyAccessProgress: Math.round(earlyAccessSubs),
        fullRevenueProgress: Math.round(fullRevSubs),
        watchHoursProgress: Math.round(watchHoursProgress),
        shortsProgress: Math.round(shortsProgress),
      };
    });

    // Per-channel cost breakdown
    const costByChannel = channels.map((ch) => {
      const chVideos = videos.filter((v) => v.channelId === ch.id);
      return {
        channelId: ch.id,
        channelName: ch.name,
        videosPublished: chVideos.length,
        totalCost: chVideos.reduce((s, v) => s + v.totalCost, 0),
        klingCost: chVideos.reduce((s, v) => s + v.klingCost, 0),
        veoCost: chVideos.reduce((s, v) => s + v.veoCost, 0),
      };
    });

    return NextResponse.json({
      summary: {
        totalVideos: videos.length,
        totalCost,
        klingCost: totalKlingCost,
        veoCost: totalVeoCost,
        avgCostPerVideo: videos.length > 0 ? totalCost / videos.length : 0,
        classificationCounts,
      },
      videos: videos.map((v) => ({
        id: v.id,
        title: v.title,
        channelId: v.channelId,
        totalCost: v.totalCost,
        klingCost: v.klingCost,
        veoCost: v.veoCost,
        qualityScore: v.qualityScore,
        publishedAt: v.publishedAt,
        analytics: v.analytics,
      })),
      monetizationProgress,
      costByChannel,
      channelAnalytics,
    });
  } catch (error) {
    console.error("[analytics GET]", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

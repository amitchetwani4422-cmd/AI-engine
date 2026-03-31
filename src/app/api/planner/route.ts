import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateContentPlan } from "@/lib/anthropic";

export async function GET(req: NextRequest) {
  try {
    const channelId = req.nextUrl.searchParams.get("channelId");

    const [channels, ideas, videos, events] = await Promise.all([
      prisma.channel.findMany({
        where: channelId ? { id: channelId } : { status: { not: "Paused" } },
        include: {
          _count: { select: { videos: true, ideas: true, scripts: true } },
          analytics: { orderBy: { recordedAt: "desc" }, take: 1 },
        },
      }),
      prisma.idea.findMany({
        where: {
          ...(channelId ? { channelId } : {}),
          status: { in: ["Draft", "Approved"] },
        },
        orderBy: { overallScore: "desc" },
        take: 20,
      }),
      prisma.video.findMany({
        where: {
          ...(channelId ? { channelId } : {}),
          status: "Published",
        },
        include: { analytics: true },
        orderBy: { publishedAt: "desc" },
        take: 20,
      }),
      prisma.culturalEvent.findMany({
        where: { date: { gte: new Date() } },
        orderBy: { date: "asc" },
        take: 5,
      }),
    ]);

    // Priority scoring for each channel
    const channelPriorities = channels.map((ch) => {
      let score = 50;
      const chVideos = videos.filter((v) => v.channelId === ch.id);
      const winners = chVideos.filter(
        (v) => v.analytics?.classification === "Winner"
      );

      if (ch.status === "Scaling") score += 30;
      if (ch.status === "Active") score += 20;
      if (ch.status === "Testing") score += 10;
      if (winners.length > 0) score += winners.length * 10;
      if (ch.subscriberCount > 500) score += 15;

      const recommendations: string[] = [];
      if (ch.status === "Paused") recommendations.push("Channel paused — review before activating");
      if (winners.length >= 2) recommendations.push("Scale winning format: " + (chVideos.find((v) => v.analytics?.classification === "Winner")?.title ?? ""));
      if (ch.subscriberCount < 100) recommendations.push("Focus on subscriber growth content");
      const daysToYPP = Math.max(0, Math.ceil(((500 - ch.subscriberCount) / Math.max(ch.subscriberCount / 30, 1))));
      if (daysToYPP < 30) recommendations.push(`~${daysToYPP} days to early YPP access`);
      if (ch.uploadCadence === "behind") recommendations.push("Upload cadence behind — prioritize quick-produce formats");

      return {
        channel: ch,
        priorityScore: score,
        recommendations,
        winnerCount: winners.length,
        pendingIdeas: ideas.filter((i) => i.channelId === ch.id).length,
      };
    });

    channelPriorities.sort((a, b) => b.priorityScore - a.priorityScore);

    // Fast-track eligible: approved ideas with existing script templates
    const fastTrackIdeas = ideas.filter(
      (i) => i.status === "Approved" && i.type !== "topic"
    );

    // Experiment queue: unscored or low-score ideas
    const experimentQueue = ideas
      .filter((i) => i.overallScore < 3 || i.overallScore === 0)
      .slice(0, 5);

    // Daily suggestion: top-scored approved idea for highest priority channel
    const topChannel = channelPriorities[0]?.channel;
    const dailySuggestion = topChannel
      ? ideas.find((i) => i.channelId === topChannel.id && i.status === "Approved") ??
        ideas.find((i) => i.channelId === topChannel.id)
      : null;

    // AI-generated weekly plan
    let weeklyPlan: object = {};
    try {
      weeklyPlan = await generateContentPlan(
        channels.map((c) => ({
          id: c.id,
          name: c.name,
          niche: c.niche,
          universe: c.universe,
          status: c.status,
          postingFrequency: c.postingFrequency,
          formatStrategy: c.formatStrategy,
          subscriberCount: c.subscriberCount,
        })),
        ideas.map((i) => ({
          id: i.id,
          title: i.title,
          channelId: i.channelId,
          overallScore: i.overallScore,
          status: i.status,
          type: i.type,
        }))
      );
    } catch {
      // Fallback: manual plan
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      weeklyPlan = days.reduce(
        (acc, day, i) => ({
          ...acc,
          [day]: channelPriorities.slice(0, 3).map((cp, j) => ({
            channelId: cp.channel.id,
            channelName: cp.channel.name,
            action: i === 0 || i === 3 ? "Publish" : i === 1 || i === 4 ? "Script" : "Research",
            idea: ideas.find((idea) => idea.channelId === cp.channel.id && idea.status === "Approved")?.title ?? "Generate new idea",
          })).filter((_, j) => j <= i % 3),
        }),
        {}
      );
    }

    return NextResponse.json({
      channelPriorities,
      dailySuggestion,
      weeklyPlan,
      fastTrackIdeas,
      experimentQueue,
      upcomingEvents: events,
      totalIdeas: ideas.length,
    });
  } catch (error) {
    console.error("[planner GET]", error);
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
  }
}

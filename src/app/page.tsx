"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Video,
  DollarSign,
  Tv,
  Lightbulb,
  Plus,
  FileText,
  Play,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  Activity,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface Channel {
  id: string;
  name: string;
  status: string;
  universe?: string;
  subscriberCount: number;
  postingFrequency?: string;
  maxBudgetPerWeek?: number;
  yppProgress?: {
    subscribers: number;
    watchHours: number;
    shortsViews: number;
  };
  _count?: { videos: number; ideas: number };
  totalCostThisWeek?: number;
}

interface PipelineStats {
  Pending?: number;
  Generating?: number;
  Assembly?: number;
  QualityCheck?: number;
  ReadyToPublish?: number;
  Published?: number;
}

const statusColors: Record<string, string> = {
  Testing: "warning",
  Active: "info",
  Scaling: "success",
  Paused: "secondary",
};

const pipelineStages = [
  { key: "Pending", label: "Pending", color: "bg-zinc-600" },
  { key: "Generating", label: "Generating", color: "bg-blue-600" },
  { key: "Assembly", label: "Assembly", color: "bg-yellow-600" },
  { key: "QualityCheck", label: "Quality Check", color: "bg-orange-600" },
  { key: "ReadyToPublish", label: "Ready", color: "bg-green-600" },
  { key: "Published", label: "Published", color: "bg-purple-600" },
];

function SkeletonCard() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-5">
        <div className="h-4 bg-zinc-800 rounded w-3/4 mb-3" />
        <div className="h-6 bg-zinc-800 rounded w-1/2 mb-2" />
        <div className="h-2 bg-zinc-800 rounded w-full" />
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [pipeline, setPipeline] = useState<PipelineStats>({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalCostWeek: 0,
    activeChannels: 0,
    ideasInQueue: 0,
  });

  useEffect(() => {
    async function load() {
      try {
        const [chRes, vidRes] = await Promise.allSettled([
          fetch("/api/channels"),
          fetch("/api/production"),
        ]);

        if (chRes.status === "fulfilled" && chRes.value.ok) {
          const data = await chRes.value.json();
          const ch: Channel[] = data.channels || data || [];
          setChannels(ch);
          setStats((s) => ({
            ...s,
            activeChannels: ch.filter((c) => c.status === "Active" || c.status === "Scaling").length,
            totalCostWeek: ch.reduce((a, c) => a + (c.totalCostThisWeek || 0), 0),
            ideasInQueue: ch.reduce((a, c) => a + (c._count?.ideas || 0), 0),
            totalVideos: ch.reduce((a, c) => a + (c._count?.videos || 0), 0),
          }));
        }

        if (vidRes.status === "fulfilled" && vidRes.value.ok) {
          const data = await vidRes.value.json();
          const videos = data.videos || data || [];
          const byStatus: PipelineStats = {};
          for (const v of videos) {
            const s = v.status as keyof PipelineStats;
            byStatus[s] = (byStatus[s] || 0) + 1;
          }
          setPipeline(byStatus);
        }
      } catch {
        // silently handle errors
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const quickStats = [
    {
      label: "Total Videos",
      value: formatNumber(stats.totalVideos),
      icon: Video,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Cost This Week",
      value: formatCurrency(stats.totalCostWeek),
      icon: DollarSign,
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
    {
      label: "Active Channels",
      value: stats.activeChannels.toString(),
      icon: Tv,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      label: "Ideas in Queue",
      value: stats.ideasInQueue.toString(),
      icon: Lightbulb,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">
            AI Content Engine
          </h1>
          <p className="text-zinc-400 mt-1">
            Welcome back, Amit. Here's your content overview.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/research">
              <Lightbulb className="h-4 w-4" />
              New Idea
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/scripts">
              <FileText className="h-4 w-4" />
              New Script
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/production">
              <Play className="h-4 w-4" />
              Start Production
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-zinc-100">
                      {loading ? (
                        <span className="inline-block h-8 w-16 bg-zinc-800 rounded animate-pulse" />
                      ) : (
                        stat.value
                      )}
                    </p>
                  </div>
                  <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Channel Status Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-100">Channel Status</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/channels">View All</Link>
          </Button>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : channels.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Tv className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-400">No channels yet.</p>
              <Button className="mt-4" size="sm" asChild>
                <Link href="/channels">Create Channel</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {channels.slice(0, 5).map((ch) => {
              const subGoal = 500;
              const subPct = Math.min(100, ((ch.subscriberCount || 0) / subGoal) * 100);
              return (
                <Link key={ch.id} href={`/channels/${ch.id}`}>
                  <Card className="hover:border-zinc-600 transition-colors cursor-pointer h-full">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-zinc-100 text-sm leading-tight">
                          {ch.name}
                        </p>
                        <Badge
                          variant={
                            (statusColors[ch.status] as any) || "secondary"
                          }
                          className="shrink-0 text-xs"
                        >
                          {ch.status}
                        </Badge>
                      </div>
                      {ch.universe && (
                        <p className="text-xs text-zinc-500">
                          Universe {ch.universe}
                        </p>
                      )}
                      <div>
                        <div className="flex justify-between text-xs text-zinc-500 mb-1">
                          <span>{formatNumber(ch.subscriberCount || 0)} subs</span>
                          <span>YPP: {subPct.toFixed(0)}%</span>
                        </div>
                        <Progress value={subPct} className="h-1.5" />
                      </div>
                      {ch.postingFrequency && (
                        <p className="text-xs text-zinc-600 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {ch.postingFrequency}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Pipeline */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Production Pipeline</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/production">View</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="h-4 bg-zinc-800 rounded w-28 animate-pulse" />
                    <div className="h-6 bg-zinc-800 rounded w-10 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {pipelineStages.map((stage) => {
                  const count = pipeline[stage.key as keyof PipelineStats] || 0;
                  const total = Object.values(pipeline).reduce((a, b) => a + b, 0) || 1;
                  const pct = (count / total) * 100;
                  return (
                    <div key={stage.key} className="flex items-center gap-3">
                      <div className="w-28 text-xs text-zinc-400">{stage.label}</div>
                      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${stage.color} transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="w-8 text-right text-sm font-medium text-zinc-300">
                        {count}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-zinc-400" />
                Recent Activity
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="h-2 w-2 rounded-full bg-zinc-800 mt-1.5 animate-pulse shrink-0" />
                    <div className="flex-1">
                      <div className="h-3.5 bg-zinc-800 rounded w-full animate-pulse mb-1" />
                      <div className="h-3 bg-zinc-800 rounded w-2/3 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { icon: CheckCircle, color: "text-green-400", text: "Script approved for Krishna Leela Ep. 3", time: "2h ago" },
                  { icon: Play, color: "text-blue-400", text: "Production started: Kali Battle Scene", time: "4h ago" },
                  { icon: TrendingUp, color: "text-purple-400", text: "Video published: Cartoon Character Intro", time: "6h ago" },
                  { icon: AlertCircle, color: "text-yellow-400", text: "Quality review pending for 2 videos", time: "8h ago" },
                  { icon: Lightbulb, color: "text-orange-400", text: "5 new ideas generated for Cooking channel", time: "1d ago" },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <Icon className={`h-4 w-4 ${item.color} mt-0.5 shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-300 leading-snug">{item.text}</p>
                        <p className="text-xs text-zinc-600 mt-0.5">{item.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cultural Calendar Preview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-zinc-400" />
              Upcoming Cultural Events
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/cultural-calendar">View Calendar</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: "Ram Navami", date: "Apr 6, 2026", type: "Religious", universe: "A" },
              { name: "Hanuman Jayanti", date: "Apr 12, 2026", type: "Religious", universe: "A" },
              { name: "Akshaya Tritiya", date: "Apr 29, 2026", type: "Auspicious", universe: "A,C" },
            ].map((event) => (
              <div
                key={event.name}
                className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50"
              >
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Calendar className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-200">{event.name}</p>
                  <p className="text-xs text-zinc-500">{event.date}</p>
                  <div className="flex gap-1 mt-1">
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                      {event.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      Universe {event.universe}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

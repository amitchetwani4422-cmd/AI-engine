"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Video, DollarSign, Tv, Lightbulb, FileText, Play,
  ArrowRight, CheckCircle, Circle, Loader2, Calendar,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useChannel } from "@/lib/channel-context";

interface DashboardStats {
  totalIdeas: number;
  approvedIdeas: number;
  totalScripts: number;
  approvedScripts: number;
  totalVideos: number;
  inProductionVideos: number;
  costThisWeek: number;
}

const FLOW_STEPS = [
  {
    step: 1,
    title: "Generate Ideas",
    description: "Pick a channel, choose an AI model, click Generate Ideas",
    href: "/research",
    cta: "Go to Research →",
    color: "border-blue-500/40 bg-blue-500/5",
    badge: "bg-blue-500/20 text-blue-400",
  },
  {
    step: 2,
    title: "Approve an Idea",
    description: "Score ideas, then click Approve on the best one",
    href: "/research",
    cta: "View Ideas →",
    color: "border-purple-500/40 bg-purple-500/5",
    badge: "bg-purple-500/20 text-purple-400",
  },
  {
    step: 3,
    title: "Generate Script",
    description: "On an approved idea, click Generate Script — AI writes the full script + scenes",
    href: "/research",
    cta: "Generate Script →",
    color: "border-yellow-500/40 bg-yellow-500/5",
    badge: "bg-yellow-500/20 text-yellow-400",
  },
  {
    step: 4,
    title: "Approve Script",
    description: "Review the script at /scripts, then click Approve Script",
    href: "/scripts",
    cta: "View Scripts →",
    color: "border-orange-500/40 bg-orange-500/5",
    badge: "bg-orange-500/20 text-orange-400",
  },
  {
    step: 5,
    title: "Start Production",
    description: "On an approved script, click Start Production — generates video scenes via Kling/Veo",
    href: "/production",
    cta: "View Production →",
    color: "border-green-500/40 bg-green-500/5",
    badge: "bg-green-500/20 text-green-400",
  },
];

export default function DashboardPage() {
  const { activeChannel, channels, loading: channelsLoading } = useChannel();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (!activeChannel) return;
    setStatsLoading(true);
    Promise.allSettled([
      fetch(`/api/ideas?channelId=${activeChannel.id}`).then((r) => r.json()),
      fetch(`/api/scripts?channelId=${activeChannel.id}`).then((r) => r.json()),
      fetch(`/api/production?channelId=${activeChannel.id}`).then((r) => r.json()),
    ]).then(([ideasRes, scriptsRes, videosRes]) => {
      const ideas = ideasRes.status === "fulfilled" && Array.isArray(ideasRes.value) ? ideasRes.value : [];
      const scripts = scriptsRes.status === "fulfilled" && Array.isArray(scriptsRes.value) ? scriptsRes.value : [];
      const videos = videosRes.status === "fulfilled" && Array.isArray(videosRes.value) ? videosRes.value : [];
      setStats({
        totalIdeas: ideas.length,
        approvedIdeas: ideas.filter((i: { status: string }) => i.status === "Approved").length,
        totalScripts: scripts.length,
        approvedScripts: scripts.filter((s: { status: string }) => s.status === "Approved").length,
        totalVideos: videos.length,
        inProductionVideos: videos.filter((v: { status: string }) => v.status === "InProduction").length,
        costThisWeek: videos.reduce((sum: number, v: { klingCost?: number; veoCost?: number }) =>
          sum + (v.klingCost ?? 0) + (v.veoCost ?? 0), 0),
      });
    }).finally(() => setStatsLoading(false));
  }, [activeChannel]);

  if (channelsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!activeChannel && channels.length === 0) {
    return (
      <div className="max-w-lg mx-auto mt-24 text-center space-y-4">
        <Tv className="h-16 w-16 text-zinc-700 mx-auto" />
        <h2 className="text-xl font-semibold text-zinc-200">No channels yet</h2>
        <p className="text-zinc-500">Create your 5 channels first to start the content pipeline.</p>
        <Button asChild>
          <Link href="/channels">Create Channels</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">
          {activeChannel ? `${activeChannel.name} — Dashboard` : "Dashboard"}
        </h1>
        <p className="text-zinc-500 mt-1 text-sm">
          {activeChannel
            ? `${activeChannel.niche} · Universe ${activeChannel.universe} · Select a different channel from the sidebar`
            : "Select a channel from the sidebar to get started"}
        </p>
      </div>

      {/* Quick Stats */}
      {activeChannel && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Ideas", value: stats?.totalIdeas ?? 0, sub: `${stats?.approvedIdeas ?? 0} approved`, icon: Lightbulb, color: "text-yellow-400", bg: "bg-yellow-500/10" },
            { label: "Scripts", value: stats?.totalScripts ?? 0, sub: `${stats?.approvedScripts ?? 0} approved`, icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "Videos", value: stats?.totalVideos ?? 0, sub: `${stats?.inProductionVideos ?? 0} in production`, icon: Video, color: "text-purple-400", bg: "bg-purple-500/10" },
            { label: "Cost (all-time)", value: formatCurrency(stats?.costThisWeek ?? 0), sub: "Kling + Veo spend", icon: DollarSign, color: "text-green-400", bg: "bg-green-500/10" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{s.label}</p>
                      <p className="text-2xl font-bold text-zinc-100">
                        {statsLoading ? <span className="inline-block h-7 w-12 bg-zinc-800 rounded animate-pulse" /> : s.value}
                      </p>
                      <p className="text-xs text-zinc-600 mt-0.5">{s.sub}</p>
                    </div>
                    <div className={`p-2.5 rounded-lg ${s.bg}`}>
                      <Icon className={`h-5 w-5 ${s.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Flow Guide */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-zinc-100">Content Pipeline — How to create a video</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Follow these 5 steps in order</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {FLOW_STEPS.map((s, i) => (
            <Link key={s.step} href={s.href}>
              <Card className={`h-full border cursor-pointer hover:brightness-110 transition-all ${s.color}`}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${s.badge}`}>
                      Step {s.step}
                    </span>
                    {i < FLOW_STEPS.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-zinc-600 hidden md:block" />
                    )}
                  </div>
                  <p className="font-semibold text-zinc-100 text-sm">{s.title}</p>
                  <p className="text-xs text-zinc-400 leading-relaxed">{s.description}</p>
                  <p className="text-xs text-zinc-500 font-medium pt-1">{s.cta}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Channels overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-100">Your Channels</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/channels">Manage →</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {channels.map((ch) => (
            <Link key={ch.id} href={`/channels/${ch.id}`}>
              <Card className={`cursor-pointer hover:border-zinc-600 transition-colors ${activeChannel?.id === ch.id ? "border-blue-500/50 bg-blue-500/5" : ""}`}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-1">
                    <p className="font-medium text-zinc-100 text-sm">{ch.name}</p>
                    <span className="text-[10px] px-1 py-0.5 rounded bg-zinc-800 text-zinc-400 shrink-0">
                      U{ch.universe}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 leading-snug">{ch.niche}</p>
                  <Badge className={`text-xs ${ch.status === "Active" ? "bg-green-500/20 text-green-400" : "bg-zinc-700 text-zinc-400"}`}>
                    {ch.status}
                  </Badge>
                  {activeChannel?.id === ch.id && (
                    <p className="text-xs text-blue-400 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Active
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

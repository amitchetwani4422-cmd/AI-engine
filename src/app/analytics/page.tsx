"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, DollarSign, Users, Play, Trophy, Target, BookOpen } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface Channel { id: string; name: string; }
interface AnalyticsData {
  summary: { totalVideos: number; totalCost: number; klingCost: number; veoCost: number; avgCostPerVideo: number; classificationCounts: Record<string, number>; };
  videos: Array<{ id: string; title: string; totalCost: number; klingCost: number; veoCost: number; qualityScore?: number; publishedAt?: string; analytics?: { views: number; watchTimeHours: number; classification?: string; } }>;
  monetizationProgress: Array<{ channelId: string; channelName: string; subscriberCount: number; watchHoursTotal: number; shortsViewsTotal: number; earlyAccessProgress: number; fullRevenueProgress: number; watchHoursProgress: number; shortsProgress: number; }>;
  costByChannel: Array<{ channelId: string; channelName: string; videosPublished: number; totalCost: number; klingCost: number; veoCost: number; }>;
}

export default function AnalyticsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState("all");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/channels").then((r) => r.json()).then((d) => setChannels(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => { fetchAnalytics(); }, [selectedChannel]);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const params = selectedChannel !== "all" ? `?channelId=${selectedChannel}` : "";
      const d = await fetch(`/api/analytics${params}`).then((r) => r.json());
      setData(d);
    } finally { setLoading(false); }
  }

  async function generatePlaybook(videoId: string) {
    await fetch("/api/format-playbooks/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId }),
    });
    alert("Playbook generated! Check the Playbooks page.");
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header title="Analytics & Growth" subtitle="Performance tracking and monetization progress" />
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-5">
          <Select value={selectedChannel} onValueChange={setSelectedChannel}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              {channels.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>
        ) : !data ? null : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Videos Published", value: formatNumber(data.summary.totalVideos), icon: <Play className="h-4 w-4 text-blue-400" /> },
                { label: "Total Spend", value: formatCurrency(data.summary.totalCost), icon: <DollarSign className="h-4 w-4 text-green-400" /> },
                { label: "Avg Cost/Video", value: formatCurrency(data.summary.avgCostPerVideo), icon: <TrendingUp className="h-4 w-4 text-yellow-400" /> },
                { label: "Winners", value: data.summary.classificationCounts["Winner"] ?? 0, icon: <Trophy className="h-4 w-4 text-yellow-400" /> },
              ].map(({ label, value, icon }) => (
                <Card key={label} className="bg-zinc-900 border-zinc-800">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-zinc-500">{label}</span></div>
                    <p className="text-xl font-bold text-zinc-100">{value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Model Cost Breakdown */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Model Cost Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Kling 3.0</p>
                    <p className="text-2xl font-bold text-blue-400">{formatCurrency(data.summary.klingCost)}</p>
                    {data.summary.totalCost > 0 && (
                      <p className="text-xs text-zinc-500 mt-0.5">{Math.round((data.summary.klingCost / data.summary.totalCost) * 100)}% of total</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Veo 3.1</p>
                    <p className="text-2xl font-bold text-purple-400">{formatCurrency(data.summary.veoCost)}</p>
                    {data.summary.totalCost > 0 && (
                      <p className="text-xs text-zinc-500 mt-0.5">{Math.round((data.summary.veoCost / data.summary.totalCost) * 100)}% of total</p>
                    )}
                  </div>
                </div>
                {data.summary.totalCost > 0 && (
                  <div className="mt-3 h-3 bg-zinc-800 rounded-full overflow-hidden flex">
                    <div className="bg-blue-500 rounded-l-full" style={{ width: `${(data.summary.klingCost / data.summary.totalCost) * 100}%` }} />
                    <div className="bg-purple-500" style={{ width: `${(data.summary.veoCost / data.summary.totalCost) * 100}%` }} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* YPP Progress */}
            {data.monetizationProgress.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2"><Target className="h-4 w-4" /> Monetization Progress</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.monetizationProgress.map((mp) => (
                    <Card key={mp.channelId} className="bg-zinc-900 border-zinc-800">
                      <CardContent className="p-4">
                        <p className="font-medium text-zinc-200 mb-3">{mp.channelName}</p>
                        <div className="space-y-2.5">
                          <div>
                            <div className="flex justify-between text-xs text-zinc-500 mb-1">
                              <span>Subscribers (Early: 500 / Full: 1000)</span>
                              <span className="text-zinc-300">{formatNumber(mp.subscriberCount)}</span>
                            </div>
                            <Progress value={mp.earlyAccessProgress} className="h-1.5" />
                          </div>
                          <div>
                            <div className="flex justify-between text-xs text-zinc-500 mb-1">
                              <span>Watch Hours (4,000)</span>
                              <span className="text-zinc-300">{mp.watchHoursTotal.toFixed(0)}h</span>
                            </div>
                            <Progress value={mp.watchHoursProgress} className="h-1.5" />
                          </div>
                          <div>
                            <div className="flex justify-between text-xs text-zinc-500 mb-1">
                              <span>Shorts Views (10M)</span>
                              <span className="text-zinc-300">{formatNumber(mp.shortsViewsTotal)}</span>
                            </div>
                            <Progress value={mp.shortsProgress} className="h-1.5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Video Performance Table */}
            <div>
              <h3 className="text-sm font-medium text-zinc-300 mb-3">Video Performance</h3>
              <div className="space-y-2">
                {data.videos.slice(0, 20).map((v) => (
                  <div key={v.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 truncate">{v.title}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {v.publishedAt ? new Date(v.publishedAt).toLocaleDateString() : "—"}
                        {v.analytics?.views ? ` · ${formatNumber(v.analytics.views)} views` : ""}
                        {v.analytics?.watchTimeHours ? ` · ${v.analytics.watchTimeHours.toFixed(1)}h` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {v.analytics?.classification && (
                        <Badge className={
                          v.analytics.classification === "Winner" ? "bg-yellow-500/20 text-yellow-400" :
                          v.analytics.classification === "Loser" ? "bg-red-500/20 text-red-400" :
                          "bg-zinc-700 text-zinc-400"
                        }>{v.analytics.classification}</Badge>
                      )}
                      <span className="text-xs text-green-400">{formatCurrency(v.totalCost)}</span>
                      {v.analytics?.classification === "Winner" && (
                        <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => generatePlaybook(v.id)}>
                          <BookOpen className="h-3 w-3 mr-1" /> Playbook
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {data.videos.length === 0 && <p className="text-center text-zinc-500 py-8 text-sm">No published videos yet</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar, TrendingUp, Zap, RefreshCw, ArrowRight, Lightbulb } from "lucide-react";

interface Channel { id: string; name: string; niche: string; status: string; }
interface PlannerData {
  channelPriorities: Array<{
    channel: Channel;
    priorityScore: number;
    recommendations: string[];
    winnerCount: number;
    pendingIdeas: number;
  }>;
  dailySuggestion: { title: string; type: string; channelId: string } | null;
  weeklyPlan: Record<string, unknown>;
  fastTrackIdeas: Array<{ id: string; title: string; channelId: string }>;
  experimentQueue: Array<{ id: string; title: string; channelId: string; overallScore: number }>;
  upcomingEvents: Array<{ id: string; name: string; date: string; type: string }>;
  totalIdeas: number;
}

export default function PlannerPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [plannerData, setPlannerData] = useState<PlannerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState("all");

  useEffect(() => {
    fetch("/api/channels").then((r) => r.json()).then((d) => setChannels(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    fetchPlan();
  }, [selectedChannel]);

  async function fetchPlan() {
    setLoading(true);
    try {
      const params = selectedChannel !== "all" ? `?channelId=${selectedChannel}` : "";
      const data = await fetch(`/api/planner${params}`).then((r) => r.json());
      setPlannerData(data);
    } finally {
      setLoading(false);
    }
  }

  const priorityColors = ["bg-yellow-500", "bg-blue-500", "bg-green-500", "bg-zinc-600"];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Content Planner"
        subtitle="Decide what to make next"
        actions={
          <Button variant="outline" onClick={fetchPlan} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh Plan
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <Select value={selectedChannel} onValueChange={setSelectedChannel}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              {channels.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>
        ) : !plannerData ? null : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Daily Suggestion */}
              {plannerData.dailySuggestion && (
                <Card className="bg-gradient-to-r from-blue-950/50 to-zinc-900 border-blue-800/40">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-yellow-400" />
                      <span className="text-xs text-zinc-400 uppercase tracking-wide">Today's Suggestion</span>
                    </div>
                    <p className="text-lg font-medium text-zinc-100">{plannerData.dailySuggestion.title}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge className="bg-blue-500/20 text-blue-400">{plannerData.dailySuggestion.type}</Badge>
                      <Link href={`/research`}>
                        <Button size="sm" variant="ghost" className="text-xs">
                          View in Research <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Channel Priority Ranking */}
              <div>
                <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Channel Priority Ranking
                </h3>
                <div className="space-y-3">
                  {plannerData.channelPriorities.map((cp, i) => (
                    <Card key={cp.channel.id} className="bg-zinc-900 border-zinc-800">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-6 h-6 rounded-full ${priorityColors[i] ?? "bg-zinc-700"} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-zinc-200">{cp.channel.name}</p>
                              <Badge className={
                                cp.channel.status === "Scaling" ? "bg-green-500/20 text-green-400" :
                                cp.channel.status === "Active" ? "bg-blue-500/20 text-blue-400" :
                                cp.channel.status === "Testing" ? "bg-yellow-500/20 text-yellow-400" :
                                "bg-zinc-700 text-zinc-400"
                              }>{cp.channel.status}</Badge>
                              {cp.winnerCount > 0 && (
                                <span className="text-xs text-yellow-400">★ {cp.winnerCount} winner{cp.winnerCount > 1 ? "s" : ""}</span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-500 mb-2">{cp.pendingIdeas} ideas pending · Score: {cp.priorityScore}</p>
                            {cp.recommendations.length > 0 && (
                              <ul className="space-y-0.5">
                                {cp.recommendations.map((rec, j) => (
                                  <li key={j} className="text-xs text-zinc-400 flex items-center gap-1">
                                    <ArrowRight className="h-3 w-3 text-zinc-600 flex-shrink-0" /> {rec}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <Link href={`/channels/${cp.channel.id}`}>
                            <Button size="sm" variant="ghost" className="flex-shrink-0">
                              View <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Fast-track eligible */}
              {plannerData.fastTrackIdeas.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-400" /> Fast-Track Eligible
                  </h3>
                  <div className="space-y-2">
                    {plannerData.fastTrackIdeas.map((idea) => (
                      <div key={idea.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                        <p className="text-sm text-zinc-300">{idea.title}</p>
                        <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">Fast-track</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Experiment Queue */}
              {plannerData.experimentQueue.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-300 mb-3">Experiment Queue</h3>
                  <div className="space-y-2">
                    {plannerData.experimentQueue.map((idea) => (
                      <div key={idea.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                        <p className="text-sm text-zinc-300">{idea.title}</p>
                        <Badge className="bg-zinc-700 text-zinc-400 text-xs">Score: {idea.overallScore.toFixed(1)}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right sidebar */}
            <div className="space-y-4">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Upcoming Events
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {plannerData.upcomingEvents.map((event) => (
                    <div key={event.id} className="border-l-2 border-zinc-700 pl-3 py-1">
                      <p className="text-xs font-medium text-zinc-200">{event.name}</p>
                      <p className="text-xs text-zinc-500">
                        {new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  ))}
                  {plannerData.upcomingEvents.length === 0 && (
                    <p className="text-xs text-zinc-600">No upcoming events</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-zinc-100">{plannerData.totalIdeas}</p>
                  <p className="text-xs text-zinc-500 mt-1">Total Ideas in Queue</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Loader2, Lock, Play, Film } from "lucide-react";

interface Playbook {
  id: string; channelId: string; name: string; hookStructure: string;
  sceneCount: number; pacing: string; thumbnailStyle: string; voiceTone: string;
  musicMood: string; modelRoutingPattern: { klingPercent: number; veoPercent: number; typicalKlingScenes?: string[]; typicalVeoScenes?: string[] };
  sourceVideoId?: string; isLocked: boolean; createdAt: string;
}
interface Channel { id: string; name: string; }

export default function PlaybooksPage() {
  const router = useRouter();
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState("all");

  useEffect(() => {
    fetch("/api/channels").then((r) => r.json()).then((d) => setChannels(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = channelFilter !== "all" ? `?channelId=${channelFilter}` : "";
    fetch(`/api/format-playbooks${params}`)
      .then((r) => r.json())
      .then((d) => setPlaybooks(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [channelFilter]);

  function getChannelName(id: string) {
    return channels.find((c) => c.id === id)?.name ?? "Unknown Channel";
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Format Playbooks"
        subtitle="Locked winning formats — reuse for consistent results"
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-5">
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              {channels.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>
        ) : playbooks.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 mb-2">No playbooks yet</p>
            <p className="text-zinc-600 text-sm mb-2">Playbooks are automatically generated when you mark a video as a Winner in Analytics.</p>
            <Button variant="outline" onClick={() => router.push("/analytics")}>Go to Analytics</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {playbooks.map((pb) => (
              <Card key={pb.id} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-zinc-100">{pb.name}</p>
                        {pb.isLocked && <Lock className="h-3.5 w-3.5 text-yellow-500" />}
                      </div>
                      <p className="text-xs text-zinc-500">{getChannelName(pb.channelId)}</p>
                    </div>
                    <Badge className="bg-yellow-500/20 text-yellow-400 flex-shrink-0">Winner Format</Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-zinc-800/50 rounded px-3 py-2">
                        <p className="text-zinc-500 mb-0.5">Hook Structure</p>
                        <p className="text-zinc-300">{pb.hookStructure}</p>
                      </div>
                      <div className="bg-zinc-800/50 rounded px-3 py-2">
                        <p className="text-zinc-500 mb-0.5">Scene Count</p>
                        <p className="text-zinc-300">{pb.sceneCount} scenes · {pb.pacing}</p>
                      </div>
                      <div className="bg-zinc-800/50 rounded px-3 py-2">
                        <p className="text-zinc-500 mb-0.5">Voice & Music</p>
                        <p className="text-zinc-300">{pb.voiceTone} · {pb.musicMood}</p>
                      </div>
                      <div className="bg-zinc-800/50 rounded px-3 py-2">
                        <p className="text-zinc-500 mb-0.5">Thumbnail Style</p>
                        <p className="text-zinc-300 truncate">{pb.thumbnailStyle}</p>
                      </div>
                    </div>

                    {/* Model routing */}
                    <div className="bg-zinc-800/50 rounded px-3 py-2">
                      <p className="text-xs text-zinc-500 mb-1.5">Model Routing Pattern</p>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="flex-1 h-2 bg-zinc-700 rounded-full overflow-hidden flex">
                          <div className="bg-blue-500 h-full" style={{ width: `${pb.modelRoutingPattern.klingPercent}%` }} />
                          <div className="bg-purple-500 h-full" style={{ width: `${pb.modelRoutingPattern.veoPercent}%` }} />
                        </div>
                      </div>
                      <div className="flex gap-3 text-xs">
                        <span className="text-blue-400">{pb.modelRoutingPattern.klingPercent}% Kling 3.0</span>
                        <span className="text-purple-400">{pb.modelRoutingPattern.veoPercent}% Veo 3.1</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/scripts?playbookId=${pb.id}`)}
                    >
                      <Play className="h-3 w-3 mr-1" /> Use Playbook
                    </Button>
                    {pb.sourceVideoId && (
                      <Button size="sm" variant="ghost" onClick={() => router.push(`/production/${pb.sourceVideoId}`)}>
                        <Film className="h-3 w-3 mr-1" /> Source
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

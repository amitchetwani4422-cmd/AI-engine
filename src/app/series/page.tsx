"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Layers, Plus, Loader2, ChevronDown, ChevronUp, Film, CheckCircle, Clock, FileText, Video, ExternalLink } from "lucide-react";

interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  status: string;
  summary?: string;
  videoId?: string;
  scriptId?: string;
  storyBeatId?: string;
}

interface Series {
  id: string;
  name: string;
  channelId: string;
  kanda?: string;
  channel?: { name: string };
  description?: string;
  status: string;
  characterIds: string[];
  continuityLog?: string;
  episodes: Episode[];
}

interface Channel { id: string; name: string; }

const statusIcon: Record<string, React.ReactNode> = {
  Planned: <Clock className="h-3 w-3 text-zinc-500" />,
  "In Production": <Loader2 className="h-3 w-3 text-yellow-400 animate-spin" />,
  Published: <CheckCircle className="h-3 w-3 text-green-400" />,
};

const statusColor: Record<string, string> = {
  Planned: "bg-zinc-700 text-zinc-400",
  "In Production": "bg-yellow-500/20 text-yellow-400",
  Published: "bg-green-500/20 text-green-400",
};

export default function SeriesPage() {
  const [series, setSeries] = useState<Series[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", channelId: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [generatingScript, setGeneratingScript] = useState<string | null>(null);
  const [scriptError, setScriptError] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/channels").then((r) => r.json()).then((d) => setChannels(Array.isArray(d) ? d : []));
    fetchSeries();
  }, []);

  async function fetchSeries() {
    setLoading(true);
    try {
      const d = await fetch("/api/series").then((r) => r.json());
      setSeries(Array.isArray(d) ? d : []);
    } finally { setLoading(false); }
  }

  async function createSeries(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await fetch("/api/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, characterIds: [] }),
      });
      setShowCreate(false);
      setForm({ name: "", channelId: "", description: "" });
      fetchSeries();
    } finally { setCreating(false); }
  }

  async function generateScript(episodeId: string) {
    setGeneratingScript(episodeId);
    setScriptError((prev) => ({ ...prev, [episodeId]: "" }));
    try {
      const res = await fetch(`/api/episodes/${episodeId}/generate-script`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setScriptError((prev) => ({ ...prev, [episodeId]: data.error ?? "Failed" }));
        return;
      }
      // Navigate to script page
      window.location.href = `/scripts/${data.id}`;
    } catch (err) {
      setScriptError((prev) => ({ ...prev, [episodeId]: String(err) }));
    } finally {
      setGeneratingScript(null);
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Series Tracker"
        description="Manage multi-episode continuity"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.href = "/arcs"}>
              <Film className="h-4 w-4 mr-2" /> Arc Generator
            </Button>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Series
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>
        ) : series.length === 0 ? (
          <div className="text-center py-16">
            <Layers className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 mb-2">कोई series नहीं है</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => window.location.href = "/arcs"}>
                <Film className="h-4 w-4 mr-2" /> Arc Generator से शुरू करें
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-2" /> Manual Create
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {series.map((s) => {
              const published = s.episodes.filter((e) => e.status === "Published").length;
              const inProd = s.episodes.filter((e) => e.status === "In Production").length;
              const planned = s.episodes.filter((e) => e.status === "Planned").length;
              const hasScript = s.episodes.filter((e) => e.scriptId).length;
              return (
                <Card key={s.id} className="bg-zinc-900 border-zinc-800">
                  <CardContent className="p-4">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Film className="h-5 w-5 text-zinc-500" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-zinc-100">{s.name}</p>
                            {s.kanda && (
                              <Badge className="bg-orange-500/20 text-orange-400 text-xs">{s.kanda} Kanda</Badge>
                            )}
                            <Badge className={s.status === "Active" ? "bg-blue-500/20 text-blue-400" : "bg-zinc-700 text-zinc-400"}>
                              {s.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {s.channel?.name} · {s.episodes.length} episodes
                            {hasScript > 0 && <span className="text-blue-400"> · {hasScript} scripts</span>}
                            {published > 0 && <span className="text-green-400"> · {published} published</span>}
                            {inProd > 0 && <span className="text-yellow-400"> · {inProd} in production</span>}
                            {planned > 0 && <span className="text-zinc-500"> · {planned} planned</span>}
                          </p>
                        </div>
                      </div>
                      {expanded === s.id ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
                    </div>

                    {expanded === s.id && (
                      <div className="mt-4 border-t border-zinc-800 pt-4">
                        {s.description && <p className="text-sm text-zinc-400 mb-3">{s.description}</p>}
                        <div className="space-y-2">
                          {s.episodes.map((ep) => (
                            <div key={ep.id} className="flex items-center gap-2 bg-zinc-800/40 rounded-lg px-3 py-2">
                              <span className="text-xs font-mono text-zinc-600 w-6 shrink-0">E{ep.episodeNumber}</span>
                              {statusIcon[ep.status] ?? <Clock className="h-3 w-3 text-zinc-500" />}
                              <p className="text-sm text-zinc-300 flex-1 min-w-0 truncate">{ep.title}</p>
                              <Badge className={`text-xs shrink-0 ${statusColor[ep.status] ?? "bg-zinc-700 text-zinc-400"}`}>
                                {ep.status}
                              </Badge>

                              {/* Action buttons */}
                              {ep.scriptId ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs text-blue-400 shrink-0"
                                  onClick={() => window.location.href = `/scripts/${ep.scriptId}`}
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" /> Script
                                </Button>
                              ) : ep.videoId ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs text-green-400 shrink-0"
                                  onClick={() => window.location.href = `/production/${ep.videoId}`}
                                >
                                  <Video className="h-3 w-3 mr-1" /> Video
                                </Button>
                              ) : ep.storyBeatId ? (
                                <div className="flex items-center gap-1 shrink-0">
                                  {scriptError[ep.id] && (
                                    <span className="text-xs text-red-400 max-w-24 truncate">{scriptError[ep.id]}</span>
                                  )}
                                  <Button
                                    size="sm"
                                    className="h-6 px-2 text-xs bg-orange-600 hover:bg-orange-700"
                                    disabled={generatingScript === ep.id}
                                    onClick={() => generateScript(ep.id)}
                                  >
                                    {generatingScript === ep.id
                                      ? <Loader2 className="h-3 w-3 animate-spin" />
                                      : <><FileText className="h-3 w-3 mr-1" /> Script बनाएं</>}
                                  </Button>
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader><DialogTitle>New Series</DialogTitle></DialogHeader>
          <form onSubmit={createSeries} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Series Name *</Label>
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. रामायण — बाल काण्ड" />
            </div>
            <div className="space-y-1.5">
              <Label>Channel *</Label>
              <Select value={form.channelId} onValueChange={(v) => setForm({ ...form, channelId: v })}>
                <SelectTrigger><SelectValue placeholder="Select channel" /></SelectTrigger>
                <SelectContent>{channels.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={creating}>{creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

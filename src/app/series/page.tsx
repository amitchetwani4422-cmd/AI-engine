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
import { Layers, Plus, Loader2, ChevronDown, ChevronUp, Film, CheckCircle, Clock, WandSparkles } from "lucide-react";

interface Episode { id: string; episodeNumber: number; title: string; status: string; summary?: string; videoId?: string; }
interface Series {
  id: string; name: string; channelId: string; channel?: { name: string };
  description?: string; status: string; characterIds: string[];
  continuityLog?: string; episodes: Episode[];
}
interface Channel { id: string; name: string; }
interface GeneratedArcEpisode {
  ideaId: string;
  episodeId: string;
  title: string;
  episodeNumber: number;
}

const RAMAYANA_KANDAS = [
  "Bala Kanda",
  "Ayodhya Kanda",
  "Aranya Kanda",
  "Kishkindha Kanda",
  "Sundara Kanda",
  "Yuddha Kanda",
  "Uttara Kanda",
] as const;

const episodeStatusIcon: Record<string, React.ReactNode> = {
  Planned: <Clock className="h-3 w-3 text-zinc-500" />,
  "In Production": <Loader2 className="h-3 w-3 text-yellow-400 animate-spin" />,
  Published: <CheckCircle className="h-3 w-3 text-green-400" />,
};

export default function SeriesPage() {
  const [series, setSeries] = useState<Series[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddEp, setShowAddEp] = useState<string | null>(null);
  const [showGenerateArc, setShowGenerateArc] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", channelId: "", description: "" });
  const [epForm, setEpForm] = useState({ title: "", summary: "", episodeNumber: 1 });
  const [arcForm, setArcForm] = useState({ kandaName: "Bala Kanda", episodeCount: 5 });
  const [creating, setCreating] = useState(false);
  const [generatingArc, setGeneratingArc] = useState(false);
  const [generatedEpisodesBySeries, setGeneratedEpisodesBySeries] = useState<Record<string, GeneratedArcEpisode[]>>({});

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

  async function addEpisode(seriesId: string) {
    await fetch(`/api/series/${seriesId}/episodes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...epForm, status: "Planned" }),
    });
    setShowAddEp(null);
    setEpForm({ title: "", summary: "", episodeNumber: 1 });
    fetchSeries();
  }

  async function generateArc(seriesId: string) {
    setGeneratingArc(true);
    try {
      const response = await fetch(`/api/series/${seriesId}/generate-arc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(arcForm),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to generate arc");
      }

      setGeneratedEpisodesBySeries((prev) => ({ ...prev, [seriesId]: payload.episodes ?? [] }));
      setShowGenerateArc(null);
      await fetchSeries();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate arc";
      alert(message);
    } finally {
      setGeneratingArc(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Series Tracker"
        description="Manage multi-episode continuity"
        actions={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> New Series</Button>}
      />
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>
        ) : series.length === 0 ? (
          <div className="text-center py-16">
            <Layers className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 mb-2">No series yet</p>
            <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> Create Series</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {series.map((s) => {
              const published = s.episodes.filter((e) => e.status === "Published").length;
              const inProd = s.episodes.filter((e) => e.status === "In Production").length;
              const planned = s.episodes.filter((e) => e.status === "Planned").length;
              const generated = generatedEpisodesBySeries[s.id] ?? [];

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
                            <Badge className={s.status === "Active" ? "bg-blue-500/20 text-blue-400" : s.status === "Completed" ? "bg-green-500/20 text-green-400" : "bg-zinc-700 text-zinc-400"}>
                              {s.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {s.channel?.name} · {s.episodes.length} episodes
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
                        {s.continuityLog && (
                          <div className="bg-zinc-800/50 rounded p-3 mb-3">
                            <p className="text-xs text-zinc-500 mb-1">Story So Far</p>
                            <p className="text-xs text-zinc-300">{s.continuityLog}</p>
                          </div>
                        )}

                        <div className="space-y-2 mb-3">
                          {s.episodes.map((ep) => (
                            <div key={ep.id} className="flex items-center gap-3 bg-zinc-800/40 rounded-lg px-3 py-2">
                              <span className="text-xs font-mono text-zinc-600 w-8">E{ep.episodeNumber}</span>
                              {episodeStatusIcon[ep.status]}
                              <p className="text-sm text-zinc-300 flex-1">{ep.title}</p>
                              <Badge className={
                                ep.status === "Published" ? "bg-green-500/20 text-green-400 text-xs" :
                                ep.status === "In Production" ? "bg-yellow-500/20 text-yellow-400 text-xs" :
                                "bg-zinc-700 text-zinc-400 text-xs"
                              }>{ep.status}</Badge>
                            </div>
                          ))}
                        </div>

                        {generated.length > 0 && (
                          <div className="rounded-lg border border-emerald-800/50 bg-emerald-900/20 p-3 mb-3">
                            <p className="text-xs font-semibold text-emerald-300 mb-2">Generated Arc Episodes</p>
                            <div className="space-y-1.5">
                              {generated.map((ep) => (
                                <p key={ep.episodeId} className="text-xs text-emerald-200">
                                  E{ep.episodeNumber}: {ep.title}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setShowAddEp(s.id); setEpForm({ ...epForm, episodeNumber: s.episodes.length + 1 }); }}>
                            <Plus className="h-3 w-3 mr-1" /> Add Episode
                          </Button>
                          <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-500 text-white"
                            onClick={() => {
                              setShowGenerateArc(s.id);
                              setArcForm({ ...arcForm, episodeCount: Math.min(8, Math.max(3, s.episodes.length + 1)) });
                            }}
                          >
                            <WandSparkles className="h-3 w-3 mr-1" /> Generate Arc
                          </Button>
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
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ram and Sita — Episode Series" />
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
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="What is this series about?" />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={creating}>{creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create Series</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showAddEp} onOpenChange={() => setShowAddEp(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader><DialogTitle>Add Episode</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Episode #</Label>
                <Input type="number" min={1} value={epForm.episodeNumber} onChange={(e) => setEpForm({ ...epForm, episodeNumber: parseInt(e.target.value) })} />
              </div>
              <div className="space-y-1.5 col-span-1">
                <Label>Title *</Label>
                <Input value={epForm.title} onChange={(e) => setEpForm({ ...epForm, title: e.target.value })} placeholder="Episode title" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Summary</Label>
              <Textarea value={epForm.summary} onChange={(e) => setEpForm({ ...epForm, summary: e.target.value })} rows={2} placeholder="What happens in this episode?" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddEp(null)}>Cancel</Button>
            <Button onClick={() => showAddEp && addEpisode(showAddEp)} disabled={!epForm.title}>Add Episode</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showGenerateArc} onOpenChange={() => setShowGenerateArc(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader><DialogTitle>Generate Arc</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Kanda</Label>
              <Select value={arcForm.kandaName} onValueChange={(value) => setArcForm({ ...arcForm, kandaName: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RAMAYANA_KANDAS.map((kanda) => (
                    <SelectItem key={kanda} value={kanda}>{kanda}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Episode Count: {arcForm.episodeCount}</Label>
              <Input
                type="range"
                min={1}
                max={15}
                value={arcForm.episodeCount}
                onChange={(e) => setArcForm({ ...arcForm, episodeCount: Number(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowGenerateArc(null)} disabled={generatingArc}>Cancel</Button>
            <Button onClick={() => showGenerateArc && generateArc(showGenerateArc)} disabled={generatingArc}>
              {generatingArc && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

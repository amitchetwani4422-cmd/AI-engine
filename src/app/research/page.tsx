"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Search, Lightbulb, Plus, Loader2, Wand2, CheckCircle,
  XCircle, Star, TrendingUp, Calendar, ExternalLink
} from "lucide-react";
import { ModelSelector } from "@/components/ui/model-selector";
import type { AIModel } from "@/lib/ai-provider";
import { DEFAULT_IDEA_MODEL } from "@/lib/ai-provider";

interface Channel { id: string; name: string; niche: string; }
interface Idea {
  id: string; title: string; description: string; type: string; format?: string;
  channelFitScore: number; noveltyScore: number; repeatabilityScore: number;
  productionDifficulty: number; estimatedCost: number; monetizationScore: number;
  overallScore: number; status: string; tags: string[]; channelId: string;
}
interface CulturalEvent { id: string; name: string; date: string; type: string; }
interface CompetitorRef {
  id: string; url: string; platform: string; formatType?: string;
  hookStructure?: string; whatWorked?: string; tags: string[]; notes?: string; channelId: string;
}

const scoreColor = (score: number) =>
  score >= 4 ? "text-green-400" : score >= 3 ? "text-yellow-400" : score >= 2 ? "text-orange-400" : "text-red-400";

export default function ResearchPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [refs, setRefs] = useState<CompetitorRef[]>([]);
  const [events, setEvents] = useState<CulturalEvent[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiModel, setAiModel] = useState<AIModel>(DEFAULT_IDEA_MODEL);
  const [showAddRef, setShowAddRef] = useState(false);
  const [refForm, setRefForm] = useState({ url: "", platform: "youtube", formatType: "", hookStructure: "", whatWorked: "", tags: "", notes: "", channelId: "" });

  useEffect(() => {
    fetch("/api/channels").then((r) => r.json()).then((d) => setChannels(Array.isArray(d) ? d : []));
    fetch("/api/cultural-calendar?future=true&limit=5").then((r) => r.json()).then((d) => setEvents(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    fetchIdeas();
    fetchRefs();
  }, [selectedChannel]);

  async function fetchIdeas() {
    setLoading(true);
    try {
      const params = selectedChannel !== "all" ? `?channelId=${selectedChannel}` : "";
      const d = await fetch(`/api/ideas${params}`).then((r) => r.json());
      setIdeas(Array.isArray(d) ? d : []);
    } finally { setLoading(false); }
  }

  async function fetchRefs() {
    const params = selectedChannel !== "all" ? `?channelId=${selectedChannel}` : "";
    fetch(`/api/competitor-references${params}`).then((r) => r.json()).then((d) => setRefs(Array.isArray(d) ? d : []));
  }

  async function generateIdeas() {
    if (selectedChannel === "all") { alert("Please select a specific channel to generate ideas."); return; }
    setGenerating(true);
    try {
      const res = await fetch("/api/ideas/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: selectedChannel, count: 5, type: "mixed", aiModel }),
      });
      if (res.ok) await fetchIdeas();
    } finally { setGenerating(false); }
  }

  async function approveIdea(id: string) {
    await fetch(`/api/ideas/${id}/approve`, { method: "POST" });
    await fetchIdeas();
  }

  async function scoreIdea(id: string) {
    await fetch(`/api/ideas/${id}/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aiModel }),
    });
    await fetchIdeas();
  }

  async function addRef(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/competitor-references", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...refForm, tags: refForm.tags.split(",").map((t) => t.trim()).filter(Boolean), channelId: refForm.channelId || selectedChannel }),
    });
    setShowAddRef(false);
    setRefForm({ url: "", platform: "youtube", formatType: "", hookStructure: "", whatWorked: "", tags: "", notes: "", channelId: "" });
    fetchRefs();
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Research & Opportunities"
        description="Generate, score, and manage content ideas"
        actions={
          <div className="flex items-center gap-3">
            <ModelSelector value={aiModel} onChange={setAiModel} />
            <Button onClick={generateIdeas} disabled={generating || selectedChannel === "all"}>
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
              Generate Ideas
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            {/* Channel selector */}
            <div className="mb-4">
              <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  {channels.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue="ideas">
              <TabsList className="bg-zinc-900 border border-zinc-800 mb-4">
                <TabsTrigger value="ideas">Ideas ({ideas.length})</TabsTrigger>
                <TabsTrigger value="refs">Competitor Refs ({refs.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="ideas">
                {loading ? (
                  <div className="flex items-center justify-center h-32"><Loader2 className="h-5 w-5 animate-spin text-zinc-500" /></div>
                ) : ideas.length === 0 ? (
                  <div className="text-center py-12">
                    <Lightbulb className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                    <p className="text-zinc-400 mb-2">No ideas yet</p>
                    <p className="text-zinc-600 text-sm">Select a channel and click Generate Ideas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ideas.map((idea) => (
                      <Card key={idea.id} className="bg-zinc-900 border-zinc-800">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <p className="font-medium text-zinc-100">{idea.title}</p>
                                <Badge className="bg-zinc-800 text-zinc-400 text-xs">{idea.type}</Badge>
                                {idea.format && <Badge className="bg-zinc-800 text-zinc-400 text-xs">{idea.format}</Badge>}
                                <Badge className={
                                  idea.status === "Approved" ? "bg-green-500/20 text-green-400" :
                                  idea.status === "Draft" ? "bg-zinc-700 text-zinc-300" :
                                  "bg-red-500/20 text-red-400"
                                }>{idea.status}</Badge>
                              </div>
                              <p className="text-sm text-zinc-400 mb-2">{idea.description}</p>
                              <div className="flex gap-3 text-xs">
                                {[
                                  { label: "Fit", val: idea.channelFitScore },
                                  { label: "Novel", val: idea.noveltyScore },
                                  { label: "Repeat", val: idea.repeatabilityScore },
                                  { label: "Monet", val: idea.monetizationScore },
                                ].map(({ label, val }) => (
                                  <span key={label} className="flex items-center gap-1">
                                    <span className="text-zinc-600">{label}:</span>
                                    <span className={scoreColor(val)}>{val > 0 ? val.toFixed(1) : "—"}</span>
                                  </span>
                                ))}
                                {idea.overallScore > 0 && (
                                  <span className="flex items-center gap-1 font-medium">
                                    <Star className="h-3 w-3 text-yellow-400" />
                                    <span className={scoreColor(idea.overallScore)}>{idea.overallScore.toFixed(1)}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 flex-shrink-0">
                              {idea.overallScore === 0 && (
                                <Button size="sm" variant="ghost" onClick={() => scoreIdea(idea.id)}>
                                  <TrendingUp className="h-3 w-3 mr-1" /> Score
                                </Button>
                              )}
                              {idea.status === "Draft" && (
                                <Button size="sm" variant="outline" onClick={() => approveIdea(idea.id)}>
                                  <CheckCircle className="h-3 w-3 mr-1" /> Approve
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="refs">
                <div className="flex justify-end mb-3">
                  <Button size="sm" onClick={() => setShowAddRef(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Reference
                  </Button>
                </div>
                {refs.length === 0 ? (
                  <div className="text-center py-12">
                    <ExternalLink className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                    <p className="text-zinc-400">No competitor references yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {refs.map((ref) => (
                      <Card key={ref.id} className="bg-zinc-900 border-zinc-800">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm truncate" onClick={(e) => e.stopPropagation()}>
                                  {ref.url}
                                </a>
                                <Badge className="bg-zinc-800 text-zinc-400 text-xs">{ref.platform}</Badge>
                              </div>
                              {ref.formatType && <p className="text-xs text-zinc-500">Format: {ref.formatType}</p>}
                              {ref.hookStructure && <p className="text-xs text-zinc-400 mt-1">Hook: {ref.hookStructure}</p>}
                              {ref.whatWorked && <p className="text-xs text-green-400 mt-1">✓ {ref.whatWorked}</p>}
                              <div className="flex gap-1 mt-2 flex-wrap">
                                {ref.tags.map((tag) => <Badge key={tag} className="bg-zinc-800 text-zinc-500 text-xs">{tag}</Badge>)}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar: upcoming events */}
          <div className="w-64 flex-shrink-0">
            <Card className="bg-zinc-900 border-zinc-800 sticky top-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {events.map((event) => (
                  <div key={event.id} className="border-l-2 border-zinc-700 pl-3 py-1">
                    <p className="text-xs font-medium text-zinc-200">{event.name}</p>
                    <p className="text-xs text-zinc-500">{new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                    <Badge className="mt-1 text-xs bg-zinc-800 text-zinc-400">{event.type}</Badge>
                  </div>
                ))}
                {events.length === 0 && <p className="text-xs text-zinc-600">No upcoming events</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showAddRef} onOpenChange={setShowAddRef}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader><DialogTitle>Add Competitor Reference</DialogTitle></DialogHeader>
          <form onSubmit={addRef} className="space-y-3">
            <div className="space-y-1.5">
              <Label>URL *</Label>
              <Input required value={refForm.url} onChange={(e) => setRefForm({ ...refForm, url: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Platform</Label>
                <Select value={refForm.platform} onValueChange={(v) => setRefForm({ ...refForm, platform: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Channel</Label>
                <Select value={refForm.channelId} onValueChange={(v) => setRefForm({ ...refForm, channelId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {channels.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Format Type</Label>
              <Input value={refForm.formatType} onChange={(e) => setRefForm({ ...refForm, formatType: e.target.value })} placeholder="e.g. Shorts, Long-form explainer" />
            </div>
            <div className="space-y-1.5">
              <Label>What Worked</Label>
              <Input value={refForm.whatWorked} onChange={(e) => setRefForm({ ...refForm, whatWorked: e.target.value })} placeholder="Strong hook, visual quality, emotional arc..." />
            </div>
            <div className="space-y-1.5">
              <Label>Tags (comma-separated)</Label>
              <Input value={refForm.tags} onChange={(e) => setRefForm({ ...refForm, tags: e.target.value })} placeholder="mythology, lipsync, vfx" />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowAddRef(false)}>Cancel</Button>
              <Button type="submit">Save Reference</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

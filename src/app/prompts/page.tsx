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
import { Code, Plus, Loader2, Lock, Unlock, Star } from "lucide-react";

interface Prompt {
  id: string; promptText: string; version: number; targetModel: string; category: string;
  channelId?: string; characterId?: string; sceneType?: string; lastUsedDate?: string;
  successRating?: string; isLocked: boolean; notes?: string; tags: string[];
  createdAt: string;
}

const ratingColors: Record<string, string> = {
  Great: "bg-green-500/20 text-green-400",
  Acceptable: "bg-yellow-500/20 text-yellow-400",
  Failed: "bg-red-500/20 text-red-400",
};

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [modelFilter, setModelFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [lockedFilter, setLockedFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ promptText: "", targetModel: "kling-3.0", category: "scene", tags: "", notes: "", sceneType: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchPrompts();
  }, [modelFilter, categoryFilter, lockedFilter]);

  async function fetchPrompts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (modelFilter !== "all") params.set("targetModel", modelFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (lockedFilter !== "all") params.set("isLocked", lockedFilter);
      const d = await fetch(`/api/prompts?${params}`).then((r) => r.json());
      setPrompts(Array.isArray(d) ? d : []);
    } finally { setLoading(false); }
  }

  async function toggleLock(id: string, current: boolean) {
    await fetch(`/api/prompts/${id}/lock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isLocked: !current }),
    });
    fetchPrompts();
  }

  async function updateRating(id: string, rating: string) {
    await fetch(`/api/prompts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ successRating: rating }),
    });
    fetchPrompts();
  }

  async function createPrompt(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean) }),
      });
      setShowCreate(false);
      setForm({ promptText: "", targetModel: "kling-3.0", category: "scene", tags: "", notes: "", sceneType: "" });
      fetchPrompts();
    } finally { setCreating(false); }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Prompt Registry"
        description="Versioned, model-specific generation prompts"
        actions={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> New Prompt</Button>}
      />
      <div className="flex-1 overflow-auto p-6">
        {/* Filters */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <Select value={modelFilter} onValueChange={setModelFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Model" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Models</SelectItem>
              <SelectItem value="kling-3.0">Kling 3.0</SelectItem>
              <SelectItem value="veo-3.1">Veo 3.1</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="scene">Scene</SelectItem>
              <SelectItem value="character">Character</SelectItem>
              <SelectItem value="thumbnail">Thumbnail</SelectItem>
              <SelectItem value="style">Style</SelectItem>
              <SelectItem value="background">Background</SelectItem>
            </SelectContent>
          </Select>
          <Select value={lockedFilter} onValueChange={setLockedFilter}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Locked</SelectItem>
              <SelectItem value="false">Unlocked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="h-5 w-5 animate-spin text-zinc-500" /></div>
        ) : prompts.length === 0 ? (
          <div className="text-center py-12">
            <Code className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">No prompts yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {prompts.map((prompt) => (
              <Card key={prompt.id} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                  <div
                    className="flex items-start justify-between gap-3 cursor-pointer"
                    onClick={() => setExpanded(expanded === prompt.id ? null : prompt.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge className={prompt.targetModel === "kling-3.0" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"}>
                          {prompt.targetModel}
                        </Badge>
                        <Badge className="bg-zinc-800 text-zinc-400">{prompt.category}</Badge>
                        {prompt.successRating && <Badge className={ratingColors[prompt.successRating] ?? "bg-zinc-700 text-zinc-300"}>{prompt.successRating}</Badge>}
                        {prompt.isLocked && <Lock className="h-3 w-3 text-yellow-500" />}
                        <span className="text-xs text-zinc-600">v{prompt.version}</span>
                      </div>
                      <p className="text-xs text-zinc-400 truncate font-mono">{prompt.promptText.substring(0, 100)}{prompt.promptText.length > 100 ? "..." : ""}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="ghost" onClick={() => toggleLock(prompt.id, prompt.isLocked)}>
                        {prompt.isLocked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>

                  {expanded === prompt.id && (
                    <div className="mt-3 border-t border-zinc-800 pt-3 space-y-3">
                      <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap bg-zinc-800/50 p-3 rounded">
                        {prompt.promptText}
                      </pre>
                      {prompt.notes && <p className="text-xs text-zinc-500">{prompt.notes}</p>}
                      {prompt.sceneType && <p className="text-xs text-zinc-600">Scene type: {prompt.sceneType}</p>}
                      <div className="flex gap-2">
                        {["Great", "Acceptable", "Failed"].map((rating) => (
                          <Button
                            key={rating}
                            size="sm"
                            variant={prompt.successRating === rating ? "default" : "ghost"}
                            onClick={() => updateRating(prompt.id, rating)}
                            className={prompt.successRating === rating ? ratingColors[rating] : ""}
                          >
                            {rating}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
          <DialogHeader><DialogTitle>New Prompt</DialogTitle></DialogHeader>
          <form onSubmit={createPrompt} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Target Model</Label>
                <Select value={form.targetModel} onValueChange={(v) => setForm({ ...form, targetModel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kling-3.0">Kling 3.0</SelectItem>
                    <SelectItem value="veo-3.1">Veo 3.1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scene">Scene</SelectItem>
                    <SelectItem value="character">Character</SelectItem>
                    <SelectItem value="thumbnail">Thumbnail</SelectItem>
                    <SelectItem value="style">Style</SelectItem>
                    <SelectItem value="background">Background</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Prompt Text *</Label>
              <Textarea required rows={5} value={form.promptText} onChange={(e) => setForm({ ...form, promptText: e.target.value })} placeholder="Write the generation prompt..." className="font-mono text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Scene Type</Label>
                <Input value={form.sceneType} onChange={(e) => setForm({ ...form, sceneType: e.target.value })} placeholder="e.g. battle, lipsync" />
              </div>
              <div className="space-y-1.5">
                <Label>Tags</Label>
                <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="mythology, action" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="What this prompt does well" />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create Prompt
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

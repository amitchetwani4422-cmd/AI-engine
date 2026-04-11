"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Users, Plus, Loader2, User, Wand2, CheckCircle, RefreshCw, Sparkles, Mic } from "lucide-react";

interface Character {
  id: string;
  name: string;
  speciesOrType: string;
  personality: string;
  preferredModel: string;
  universeId?: string;
  channelId?: string;
  approvedImages: string[];
  colorPalette: string[];
  seriesIds: string[];
  referencePrompt?: string;
  activeImage?: string;
  _count?: { approvedPrompts: number };
}

const modelColors: Record<string, string> = {
  "kling-3.0": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "veo-3.1": "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [creating, setCreating] = useState(false);
  const [generatingImage, setGeneratingImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<Record<string, string>>({});
  const [seedingChars, setSeedingChars] = useState(false);
  const [seedCharResult, setSeedCharResult] = useState<string | null>(null);
  const [seedingVoices, setSeedingVoices] = useState(false);
  const [seedVoiceResult, setSeedVoiceResult] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    speciesOrType: "",
    personality: "",
    preferredModel: "kling-3.0",
    universeId: "",
    colorPalette: "",
    worldRole: "",
  });

  useEffect(() => {
    fetchCharacters();
  }, []);

  async function fetchCharacters() {
    setLoading(true);
    try {
      const res = await fetch("/api/characters");
      const data = await res.json();
      setCharacters(Array.isArray(data) ? data : []);
    } catch {
      setCharacters([]);
    } finally {
      setLoading(false);
    }
  }

  async function seedRamayanaCharacters() {
    setSeedingChars(true);
    setSeedCharResult(null);
    try {
      const res = await fetch("/api/seed/ramayana/characters", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const data = await res.json();
      if (res.ok) {
        setSeedCharResult(`Done — ${data.created} created, ${data.updated} updated on channel "${data.channelName}"`);
        fetchCharacters();
      } else {
        setSeedCharResult(`Error: ${data.error}`);
      }
    } catch (e) {
      setSeedCharResult(`Error: ${String(e)}`);
    } finally {
      setSeedingChars(false);
    }
  }

  async function seedRamayanaVoices() {
    setSeedingVoices(true);
    setSeedVoiceResult(null);
    try {
      const res = await fetch("/api/seed/ramayana/voices", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSeedVoiceResult(`Voices done — ${data.summary.created} created, ${data.summary.skipped} skipped · Narrator: ${data.summary.narrator}`);
      } else {
        setSeedVoiceResult(`Error: ${data.error}`);
      }
    } catch (e) {
      setSeedVoiceResult(`Error: ${String(e)}`);
    } finally {
      setSeedingVoices(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          colorPalette: form.colorPalette.split(",").map((c) => c.trim()).filter(Boolean),
          visualReferences: [],
          approvedImages: [],
          approvedExpressions: [],
          restrictedChanges: [],
          samplePoses: [],
          seriesIds: [],
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ name: "", speciesOrType: "", personality: "", preferredModel: "kling-3.0", universeId: "", colorPalette: "", worldRole: "" });
        fetchCharacters();
      }
    } finally {
      setCreating(false);
    }
  }

  async function generateReferenceImage(e: React.MouseEvent, charId: string) {
    e.preventDefault(); // prevent Link navigation
    e.stopPropagation();
    setGeneratingImage(charId);
    setImageError(prev => ({ ...prev, [charId]: "" }));
    try {
      const res = await fetch(`/api/characters/${charId}/generate-reference-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) { setImageError(prev => ({ ...prev, [charId]: data.error ?? "Failed" })); return; }
      fetchCharacters();
    } catch (err) {
      setImageError(prev => ({ ...prev, [charId]: String(err) }));
    } finally {
      setGeneratingImage(null);
    }
  }

  const filtered = filter === "all" ? characters : characters.filter((c) => c.preferredModel === filter || c.universeId === filter);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Character Studio"
        description="Manage recurring characters across all channels"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={seedRamayanaCharacters} disabled={seedingChars}>
              {seedingChars
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Seeding...</>
                : <><Sparkles className="h-4 w-4 mr-2" /> Seed Ramayana Characters</>}
            </Button>
            <Button variant="outline" onClick={seedRamayanaVoices} disabled={seedingVoices}>
              {seedingVoices
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Seeding Voices...</>
                : <><Mic className="h-4 w-4 mr-2" /> Seed Voices</>}
            </Button>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Character
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        {seedCharResult && (
          <div className={`mb-4 px-4 py-2.5 rounded-lg text-sm border ${seedCharResult.startsWith("Error") ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-green-500/10 border-green-500/20 text-green-400"}`}>
            {seedCharResult}
          </div>
        )}
        {seedVoiceResult && (
          <div className={`mb-4 px-4 py-2.5 rounded-lg text-sm border ${seedVoiceResult.startsWith("Error") ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-purple-500/10 border-purple-500/20 text-purple-400"}`}>
            {seedVoiceResult}
          </div>
        )}
        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {["all", "kling-3.0", "veo-3.1", "A", "B", "C"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 mb-2">No characters yet</p>
            <p className="text-zinc-600 text-sm mb-6">Create your first character to start building reusable character memory</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" /> Create Character
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((char) => (
              <Card key={char.id} className={`bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-colors h-full ${char.activeImage ? "border-green-800/40" : ""}`}>
                <CardContent className="p-4">
                  <Link href={`/characters/${char.id}`} className="block">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden border border-zinc-700">
                        {char.activeImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={char.activeImage} alt={char.name} className="w-12 h-12 object-cover" />
                        ) : char.approvedImages[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={char.approvedImages[0]} alt={char.name} className="w-12 h-12 object-cover" />
                        ) : (
                          <User className="h-5 w-5 text-zinc-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-zinc-100 truncate">{char.name}</p>
                          {char.activeImage && <CheckCircle className="h-3 w-3 text-green-400 shrink-0" />}
                        </div>
                        <p className="text-xs text-zinc-500 truncate">{char.speciesOrType}</p>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 mb-3 line-clamp-2">{char.personality}</p>
                  </Link>

                  {/* Generate Reference Image button */}
                  <div className="mb-3">
                    {imageError[char.id] && (
                      <p className="text-xs text-red-400 mb-1 truncate">{imageError[char.id]}</p>
                    )}
                    <Button
                      size="sm"
                      className={`w-full h-7 text-xs ${char.activeImage ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300" : "bg-orange-600 hover:bg-orange-700 text-white"}`}
                      disabled={generatingImage === char.id}
                      onClick={(e) => generateReferenceImage(e, char.id)}
                    >
                      {generatingImage === char.id ? (
                        <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Generating (~30s)...</>
                      ) : char.activeImage ? (
                        <><RefreshCw className="h-3 w-3 mr-1" /> Regenerate Image</>
                      ) : (
                        <><Wand2 className="h-3 w-3 mr-1" /> Generate Reference Image</>
                      )}
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded border ${modelColors[char.preferredModel] ?? "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
                      {char.preferredModel}
                    </span>
                    {char.universeId && (
                      <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                        U{char.universeId}
                      </span>
                    )}
                    {char.approvedImages.length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700">
                        {char.approvedImages.length} images
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
          <DialogHeader>
            <DialogTitle>New Character</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Rohan the Lion"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Species / Type *</Label>
                <Input
                  required
                  value={form.speciesOrType}
                  onChange={(e) => setForm({ ...form, speciesOrType: e.target.value })}
                  placeholder="e.g. Lion, Human, God"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Personality</Label>
              <Textarea
                value={form.personality}
                onChange={(e) => setForm({ ...form, personality: e.target.value })}
                placeholder="Describe character personality, traits, quirks..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Preferred Model</Label>
                <Select
                  value={form.preferredModel}
                  onValueChange={(v) => setForm({ ...form, preferredModel: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kling-3.0">Kling 3.0</SelectItem>
                    <SelectItem value="veo-3.1">Veo 3.1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Universe</Label>
                <Select
                  value={form.universeId}
                  onValueChange={(v) => setForm({ ...form, universeId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select universe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A — Mythology & Bhakti</SelectItem>
                    <SelectItem value="B">B — Character & Entertainment</SelectItem>
                    <SelectItem value="C">C — Cooking Spectacle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Color Palette (comma-separated hex codes)</Label>
              <Input
                value={form.colorPalette}
                onChange={(e) => setForm({ ...form, colorPalette: e.target.value })}
                placeholder="#FF6B35, #2C3E50, #F39C12"
              />
            </div>
            <div className="space-y-1.5">
              <Label>World Role</Label>
              <Input
                value={form.worldRole}
                onChange={(e) => setForm({ ...form, worldRole: e.target.value })}
                placeholder="e.g. Hero, Narrator, Comic Relief"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Character
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Lock,
  AlertTriangle,
  Mic,
  Image as ImageIcon,
  Code,
  User,
  Wand2,
  Sparkles,
  X,
  ZoomIn,
} from "lucide-react";
import { ModelSelector } from "@/components/ui/model-selector";
import type { AIModel } from "@/lib/ai-provider";
import { DEFAULT_SCRIPT_MODEL } from "@/lib/ai-provider";

interface CharacterPrompt {
  id: string;
  promptText: string;
  version: number;
  targetModel: string;
  status: string;
  notes?: string;
  createdAt: string;
}

interface Character {
  id: string;
  name: string;
  speciesOrType: string;
  personality: string;
  visualReferences: string[];
  approvedImages: string[];
  approvedExpressions: string[];
  clothingRules?: string;
  colorPalette: string[];
  worldRole?: string;
  preferredModel: string;
  universeId?: string;
  seriesIds: string[];
  channelId?: string;
  restrictedChanges: string[];
  samplePoses: string[];
  approvedPrompts: CharacterPrompt[];
}

export default function CharacterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingPrompt, setAddingPrompt] = useState(false);
  const [newPrompt, setNewPrompt] = useState({ promptText: "", targetModel: "kling-3.0", notes: "" });
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [aiModel, setAiModel] = useState<AIModel>(DEFAULT_SCRIPT_MODEL);
  const [generateMsg, setGenerateMsg] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/characters/${id}`)
      .then((r) => r.json())
      .then((data) => { if (data && !data.error) setCharacter(data); })
      .finally(() => setLoading(false));
  }, [id]);

  async function addPrompt() {
    setSaving(true);
    try {
      // Prompts are stored via the prompts API
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newPrompt,
          characterId: id,
          category: "character",
        }),
      });
      if (res.ok) {
        setAddingPrompt(false);
        setNewPrompt({ promptText: "", targetModel: "kling-3.0", notes: "" });
        // Refresh
        const updated = await fetch(`/api/characters/${id}`).then((r) => r.json());
        setCharacter(updated);
      }
    } finally {
      setSaving(false);
    }
  }

  async function generateCharacter() {
    setGenerating(true);
    setGenerateMsg(null);
    try {
      const res = await fetch(`/api/characters/${id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiModel }),
      });
      const data = await res.json();
      if (data.character) {
        setCharacter(data.character);
        setGenerateMsg(data.generatedImageUrl ? "Character bible + reference image generated!" : "Character bible generated (image generation failed — check FAL_API_KEY)");
      }
    } finally {
      setGenerating(false);
    }
  }

  async function generateImage() {
    setGeneratingImage(true);
    try {
      const res = await fetch(`/api/characters/${id}/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addToApproved: true }),
      });
      const data = await res.json();
      if (data.imageUrl && character) {
        setCharacter({ ...character, approvedImages: [...character.approvedImages, data.imageUrl] });
      }
    } finally {
      setGeneratingImage(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!character) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-400">Character not found</p>
        <Button variant="ghost" onClick={() => router.push("/characters")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Characters
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title={character.name}
        description={`${character.speciesOrType} · Universe ${character.universeId ?? "—"}`}
        actions={
          <div className="flex items-center gap-3">
            <ModelSelector value={aiModel} onChange={setAiModel} />
            <Button onClick={generateCharacter} disabled={generating}>
              {generating
                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                : <Wand2 className="h-4 w-4 mr-2" />}
              Generate with AI
            </Button>
            <Button variant="ghost" onClick={() => router.push("/characters")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        {generateMsg && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 flex-shrink-0" />
            {generateMsg}
          </div>
        )}
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="visuals">Visuals</TabsTrigger>
            <TabsTrigger value="voice">Voice</TabsTrigger>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader><CardTitle className="text-sm">Character Info</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Name</span>
                    <span className="text-zinc-200">{character.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Species / Type</span>
                    <span className="text-zinc-200">{character.speciesOrType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">World Role</span>
                    <span className="text-zinc-200">{character.worldRole ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Preferred Model</span>
                    <Badge className={character.preferredModel === "kling-3.0" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"}>
                      {character.preferredModel}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Universe</span>
                    <span className="text-zinc-200">Universe {character.universeId ?? "—"}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader><CardTitle className="text-sm">Personality</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-zinc-300 leading-relaxed">{character.personality || "No personality defined yet."}</p>
                </CardContent>
              </Card>
            </div>

            {/* Restricted Changes Warning */}
            {character.restrictedChanges.length > 0 && (
              <Card className="bg-red-950/30 border-red-800/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-300 mb-2">Restricted Changes — Never Modify:</p>
                      <ul className="space-y-1">
                        {character.restrictedChanges.map((r, i) => (
                          <li key={i} className="text-sm text-red-400">• {r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Visuals Tab */}
          <TabsContent value="visuals" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader><CardTitle className="text-sm">Color Palette</CardTitle></CardHeader>
                <CardContent>
                  {character.colorPalette.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {character.colorPalette.map((color, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded border border-zinc-700" style={{ backgroundColor: color }} />
                          <span className="text-xs text-zinc-400 font-mono">{color}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500">No color palette defined</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader><CardTitle className="text-sm">Clothing Rules</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-zinc-300">{character.clothingRules || "No clothing rules defined"}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Approved Images</CardTitle>
                <Button size="sm" variant="outline" onClick={generateImage} disabled={generatingImage}>
                  {generatingImage
                    ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    : <Sparkles className="h-3 w-3 mr-1.5" />}
                  Generate with FLUX
                </Button>
              </CardHeader>
              <CardContent>
                {character.approvedImages.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {character.approvedImages.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setLightboxUrl(url)}
                        className="relative group w-full aspect-square rounded border border-zinc-700 overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Ref ${i + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-8 gap-2">
                    <ImageIcon className="h-8 w-8 text-zinc-600" />
                    <p className="text-sm text-zinc-500">No approved images yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle className="text-sm">Approved Expressions</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {character.approvedExpressions.map((expr, i) => (
                    <Badge key={i} className="bg-zinc-800 text-zinc-300">{expr}</Badge>
                  ))}
                  {character.approvedExpressions.length === 0 && (
                    <p className="text-sm text-zinc-500">No expressions defined</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Voice Tab */}
          <TabsContent value="voice">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Mic className="h-4 w-4" /> Voice Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-zinc-400">
                  Voice assignment is managed via the Voice & Audio module. Link a voice asset to this character there.
                </p>
                <Button variant="outline" onClick={() => router.push("/voice")}>
                  <Mic className="h-4 w-4 mr-2" /> Go to Voice & Audio
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prompts Tab */}
          <TabsContent value="prompts" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">Model-specific generation prompts for this character</p>
              <Button size="sm" onClick={() => setAddingPrompt(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Prompt
              </Button>
            </div>

            {addingPrompt && (
              <Card className="bg-zinc-800 border-zinc-700">
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Target Model</Label>
                      <Select value={newPrompt.targetModel} onValueChange={(v) => setNewPrompt({ ...newPrompt, targetModel: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kling-3.0">Kling 3.0</SelectItem>
                          <SelectItem value="veo-3.1">Veo 3.1</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Notes</Label>
                      <Input value={newPrompt.notes} onChange={(e) => setNewPrompt({ ...newPrompt, notes: e.target.value })} placeholder="What this prompt is for" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Prompt Text *</Label>
                    <Textarea
                      value={newPrompt.promptText}
                      onChange={(e) => setNewPrompt({ ...newPrompt, promptText: e.target.value })}
                      placeholder="Write the generation prompt for this character..."
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setAddingPrompt(false)}>Cancel</Button>
                    <Button size="sm" onClick={addPrompt} disabled={saving || !newPrompt.promptText}>
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Save Prompt
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {["kling-3.0", "veo-3.1"].map((model) => {
              const modelPrompts = character.approvedPrompts.filter((p) => p.targetModel === model);
              return (
                <div key={model}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={model === "kling-3.0" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"}>
                      {model}
                    </Badge>
                    <span className="text-xs text-zinc-500">{modelPrompts.length} prompt(s)</span>
                  </div>
                  <div className="space-y-2">
                    {modelPrompts.map((prompt) => (
                      <Card key={prompt.id} className="bg-zinc-900 border-zinc-800">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-500">v{prompt.version}</span>
                              {prompt.status === "locked" && <Lock className="h-3 w-3 text-yellow-500" />}
                              <Badge className={
                                prompt.status === "locked" ? "bg-yellow-500/20 text-yellow-400" :
                                prompt.status === "active" ? "bg-green-500/20 text-green-400" :
                                "bg-zinc-700 text-zinc-400"
                              }>
                                {prompt.status}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-zinc-300 font-mono whitespace-pre-wrap bg-zinc-800/50 p-2 rounded">
                            {prompt.promptText}
                          </p>
                          {prompt.notes && (
                            <p className="text-xs text-zinc-500 mt-2">{prompt.notes}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    {modelPrompts.length === 0 && (
                      <p className="text-sm text-zinc-600 italic pl-2">No prompts for {model} yet</p>
                    )}
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-zinc-800/80 rounded-full p-2 transition-colors"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Full size reference"
            className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <a
            href={lightboxUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 text-xs text-zinc-400 hover:text-zinc-200 underline"
            onClick={(e) => e.stopPropagation()}
          >
            Open original ↗
          </a>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Upload, Trash2, Loader2, Image as ImageIcon, CheckCircle, RefreshCw, Lock, Plus, Save, Edit2, Sparkles } from "lucide-react";
import { useChannel } from "@/lib/channel-context";
import { cn } from "@/lib/utils";

interface LocationAsset {
  id: string;
  name: string;
  nameHindi: string;
  description: string;
  kandas: string[];
  channelId?: string | null;
  referenceImages: string[];
  visualKeywords: string;
  lockedVisualDesc?: string;
  isVisualLocked?: boolean;
}

const universeColors: Record<string, string> = {
  A: "bg-orange-500/20 text-orange-400",
  B: "bg-blue-500/20 text-blue-400",
  C: "bg-green-500/20 text-green-400",
};

function LocationsContent() {
  const { channels, loading: channelsLoading } = useChannel();
  const [locations, setLocations] = useState<LocationAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState<Record<string, string>>({});
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<string>("all");

  // Inline locked visual desc editing
  const [editingDesc, setEditingDesc] = useState<string | null>(null);
  const [descDraft, setDescDraft] = useState<string>("");
  const [savingDesc, setSavingDesc] = useState<string | null>(null);

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    channelId: "",
    name: "",
    nameHindi: "",
    description: "",
    visualKeywords: "",
    lockedVisualDesc: "",
    kandas: "",
  });
  const [createImageUrl, setCreateImageUrl] = useState<string | null>(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [uploadingCreateImage, setUploadingCreateImage] = useState(false);
  const createFileInputRef = useRef<HTMLInputElement | null>(null);

  // File input refs per location
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const searchParams = useSearchParams();
  const highlight = searchParams.get("highlight") ?? "";
  const highlightRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { fetchLocations(channelFilter); }, [channelFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!loading && highlight && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [loading, highlight]);

  async function fetchLocations(filter: string) {
    setLoading(true);
    try {
      const url = filter === "all" ? "/api/locations" : `/api/locations?channelId=${filter}`;
      const d = await fetch(url).then(r => r.json());
      setLocations(Array.isArray(d) ? d : []);
    } finally { setLoading(false); }
  }

  async function seedLocations() {
    if (channelFilter === "all") {
      setSeedResult("Please select a specific channel before seeding — Ramayana locations will be pinned to that channel only.");
      return;
    }
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await fetch("/api/locations/seed-ramayana", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: channelFilter }),
      });
      const data = await res.json();
      if (res.ok) {
        setSeedResult(`✓ ${data.seeded} Ramayana locations seeded and pinned to this channel.`);
        await fetchLocations(channelFilter);
      } else {
        setSeedResult(`Error: ${data.error ?? "Seed failed"}`);
      }
    } catch (e) {
      setSeedResult(`Error: ${String(e)}`);
    } finally {
      setSeeding(false);
    }
  }

  async function addImageUrl(loc: LocationAsset) {
    const url = urlInput[loc.id]?.trim();
    if (!url) return;
    setUploading(loc.id);
    try {
      await fetch("/api/locations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: loc.id, referenceImages: [...loc.referenceImages, url] }),
      });
      setUrlInput(prev => ({ ...prev, [loc.id]: "" }));
      fetchLocations(channelFilter);
    } finally { setUploading(null); }
  }

  async function uploadImageFile(loc: LocationAsset, file: File) {
    setUploadingFile(loc.id);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "ai-engine/locations");
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Upload failed"); return; }
      await fetch("/api/locations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: loc.id, referenceImages: [...loc.referenceImages, data.url] }),
      });
      fetchLocations(channelFilter);
    } finally {
      setUploadingFile(null);
      if (fileInputRefs.current[loc.id]) fileInputRefs.current[loc.id]!.value = "";
    }
  }

  async function removeImage(loc: LocationAsset, imageUrl: string) {
    await fetch("/api/locations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: loc.id, referenceImages: loc.referenceImages.filter(u => u !== imageUrl) }),
    });
    fetchLocations(channelFilter);
  }

  async function saveLockedDesc(loc: LocationAsset) {
    setSavingDesc(loc.id);
    try {
      await fetch("/api/locations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: loc.id, lockedVisualDesc: descDraft.trim() || null }),
      });
      setEditingDesc(null);
      fetchLocations(channelFilter);
    } finally { setSavingDesc(null); }
  }

  async function deleteLocation(id: string) {
    if (!confirm("Delete this location?")) return;
    await fetch("/api/locations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchLocations(channelFilter);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createForm,
          channelId: createForm.channelId || null,
          kandas: createForm.kandas.split(",").map(s => s.trim()).filter(Boolean),
          referenceImages: createImageUrl ? [createImageUrl] : [],
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setCreateForm({ channelId: "", name: "", nameHindi: "", description: "", visualKeywords: "", lockedVisualDesc: "", kandas: "" });
        fetchLocations(channelFilter);
      }
    } finally { setCreating(false); }
  }

  async function uploadAndAnalyzeCreateImage(file: File) {
    setUploadingCreateImage(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "ai-engine/locations");
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Upload failed"); return; }
      const uploadedUrl: string = data.url;
      setCreateImageUrl(uploadedUrl);

      // Auto-analyze with Claude Vision
      setAnalyzingImage(true);
      try {
        const channelNiche = channels.find((c) => c.id === createForm.channelId)?.niche;
        const aiRes = await fetch("/api/locations/describe-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: uploadedUrl, channelNiche }),
        });
        const aiData = await aiRes.json();
        if (aiRes.ok) {
          setCreateForm(prev => ({
            ...prev,
            name: prev.name || (aiData.suggestedName ?? ""),
            description: prev.description || (aiData.description ?? ""),
            visualKeywords: prev.visualKeywords || (aiData.visualKeywords ?? ""),
            lockedVisualDesc: aiData.lockedVisualDesc ?? prev.lockedVisualDesc,
          }));
        }
      } finally {
        setAnalyzingImage(false);
      }
    } finally {
      setUploadingCreateImage(false);
      if (createFileInputRef.current) createFileInputRef.current.value = "";
    }
  }

  const activeChannelName = (id: string) => channels.find((c) => c.id === id)?.name;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Location References"
        description="Scene environment descriptions and reference images per channel"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={seedLocations} disabled={seeding}>
              {seeding
                ? <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> Seeding...</>
                : <><RefreshCw className="h-3 w-3 mr-1.5" /> Seed Ramayana Locations</>}
            </Button>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> New Location
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        {seedResult && (
          <div className={`mb-4 px-4 py-2.5 rounded-lg text-sm border ${seedResult.startsWith("Error") || seedResult.startsWith("Please") ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-green-500/10 border-green-500/20 text-green-400"}`}>
            {seedResult}
          </div>
        )}

        {/* Channel filter bar */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setChannelFilter("all")}
            className={cn("px-3 py-1.5 rounded-md text-sm transition-colors", channelFilter === "all" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200")}
          >
            All Channels
          </button>
          {channelsLoading ? (
            <span className="px-3 py-1.5 text-sm text-zinc-600">Loading...</span>
          ) : (
            channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setChannelFilter(ch.id)}
                className={cn("px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1.5", channelFilter === ch.id ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200")}
              >
                <span className={cn("text-[10px] px-1 py-0.5 rounded font-medium", universeColors[ch.universe] ?? "bg-zinc-700 text-zinc-400")}>
                  U{ch.universe}
                </span>
                {ch.name}
              </button>
            ))
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : locations.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 mb-2">No locations for this channel yet</p>
            <p className="text-zinc-600 text-sm mb-6 max-w-sm mx-auto">
              Create a location and write its scene prompt — this text gets injected into every FAL video prompt for consistent backgrounds.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-2" /> New Location
              </Button>
              {channelFilter !== "all" && (
                <Button variant="outline" onClick={seedLocations} disabled={seeding}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Seed Ramayana Locations
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {locations.map((loc) => {
              const isHighlighted = highlight && loc.name.toLowerCase() === highlight.toLowerCase();
              const chName = loc.channelId ? activeChannelName(loc.channelId) : null;
              const isEditingThisDesc = editingDesc === loc.id;
              const isUploadingThis = uploadingFile === loc.id;
              return (
                <Card
                  key={loc.id}
                  ref={isHighlighted ? (el) => { highlightRef.current = el; } : undefined}
                  className={`bg-zinc-900 border transition-all ${isHighlighted ? "border-amber-500/60 ring-2 ring-amber-500/30" : "border-zinc-800"}`}
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <MapPin className="h-4 w-4 text-orange-400 shrink-0" />
                          <p className="font-medium text-zinc-100">{loc.name}</p>
                          {loc.referenceImages.length > 0 && <CheckCircle className="h-3.5 w-3.5 text-green-400" />}
                          {chName && channelFilter === "all" && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700">{chName}</span>
                          )}
                        </div>
                        {loc.nameHindi && loc.nameHindi !== loc.name && (
                          <p className="text-sm text-orange-300/70 mt-0.5 ml-6">{loc.nameHindi}</p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0 items-center">
                        {loc.kandas.length > 0 && loc.kandas.slice(0, 2).map(k => (
                          <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">{k}</span>
                        ))}
                        <button onClick={() => deleteLocation(loc.id)} className="ml-1 text-zinc-600 hover:text-red-400 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {loc.description && <p className="text-xs text-zinc-500">{loc.description}</p>}
                    {loc.visualKeywords && <p className="text-xs text-zinc-600 font-mono">{loc.visualKeywords}</p>}

                    {/* Locked visual description — inline editable */}
                    <div className="bg-amber-950/20 border border-amber-700/30 rounded-lg p-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Lock className="h-3 w-3 text-amber-400" />
                          <span className="text-xs font-medium text-amber-400">Scene Prompt</span>
                          {loc.isVisualLocked && !isEditingThisDesc && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">Active</span>
                          )}
                        </div>
                        {!isEditingThisDesc ? (
                          <button
                            onClick={() => { setEditingDesc(loc.id); setDescDraft(loc.lockedVisualDesc ?? ""); }}
                            className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
                          >
                            <Edit2 className="h-3 w-3" /> Edit
                          </button>
                        ) : (
                          <div className="flex gap-1.5">
                            <button onClick={() => setEditingDesc(null)} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Cancel</button>
                            <button
                              onClick={() => saveLockedDesc(loc)}
                              disabled={savingDesc === loc.id}
                              className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors disabled:opacity-50"
                            >
                              {savingDesc === loc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
                            </button>
                          </div>
                        )}
                      </div>
                      {isEditingThisDesc ? (
                        <Textarea
                          value={descDraft}
                          onChange={e => setDescDraft(e.target.value)}
                          rows={5}
                          className="text-xs bg-zinc-900 border-amber-700/40 text-amber-100/80"
                          placeholder="Write the scene environment description injected into every FAL prompt for this location…"
                          autoFocus
                        />
                      ) : loc.lockedVisualDesc ? (
                        <p className="text-xs text-amber-200/70 leading-relaxed italic">"{loc.lockedVisualDesc}"</p>
                      ) : (
                        <p className="text-xs text-zinc-600 italic">No scene prompt yet — click Edit to add one.</p>
                      )}
                    </div>

                    {/* Reference images */}
                    {loc.referenceImages.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {loc.referenceImages.map((url, i) => (
                          <div key={i} className="relative group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`${loc.name} ref ${i + 1}`} className="w-24 h-16 object-cover rounded border border-zinc-700" />
                            <button
                              onClick={() => removeImage(loc, url)}
                              className="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload image from computer */}
                    <div className="flex items-center gap-2">
                      <input
                        ref={el => { fileInputRefs.current[loc.id] = el; }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) uploadImageFile(loc, f); }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs border-zinc-700 text-zinc-400 hover:text-zinc-200"
                        disabled={isUploadingThis}
                        onClick={() => fileInputRefs.current[loc.id]?.click()}
                      >
                        {isUploadingThis
                          ? <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> Uploading...</>
                          : <><Upload className="h-3 w-3 mr-1.5" /> Upload Image</>}
                      </Button>
                      <span className="text-zinc-600 text-xs">or</span>
                      <Input
                        placeholder="Paste image URL"
                        value={urlInput[loc.id] ?? ""}
                        onChange={e => setUrlInput(prev => ({ ...prev, [loc.id]: e.target.value }))}
                        onKeyDown={e => e.key === "Enter" && addImageUrl(loc)}
                        className="text-xs h-8 flex-1"
                      />
                      <Button
                        size="sm" className="h-8 px-3 shrink-0"
                        disabled={uploading === loc.id || !urlInput[loc.id]?.trim()}
                        onClick={() => addImageUrl(loc)}
                      >
                        {uploading === loc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
                      </Button>
                    </div>

                    {loc.referenceImages.length === 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                        <ImageIcon className="h-3 w-3" />
                        No reference image — will use scene prompt text only
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Location Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) { setCreateImageUrl(null); setCreateForm({ channelId: "", name: "", nameHindi: "", description: "", visualKeywords: "", lockedVisualDesc: "", kandas: "" }); } }}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Location</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">

            {/* Step 1 — Upload image (primary flow) */}
            <input
              ref={createFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadAndAnalyzeCreateImage(f); }}
            />
            <div
              onClick={() => !uploadingCreateImage && !analyzingImage && createFileInputRef.current?.click()}
              className={cn(
                "relative rounded-lg border-2 border-dashed transition-colors cursor-pointer overflow-hidden",
                createImageUrl ? "border-zinc-700" : "border-zinc-700 hover:border-blue-500/60",
                (uploadingCreateImage || analyzingImage) && "pointer-events-none"
              )}
            >
              {createImageUrl ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={createImageUrl} alt="Location reference" className="w-full h-40 object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-medium">Click to replace</span>
                  </div>
                  {analyzingImage && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                      <Sparkles className="h-5 w-5 text-blue-400 animate-pulse" />
                      <span className="text-xs text-blue-300">AI analyzing image…</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-32 flex flex-col items-center justify-center gap-2 text-zinc-500">
                  {uploadingCreateImage ? (
                    <><Loader2 className="h-6 w-6 animate-spin" /><span className="text-xs">Uploading…</span></>
                  ) : (
                    <>
                      <Upload className="h-6 w-6" />
                      <span className="text-sm font-medium text-zinc-400">Upload location image</span>
                      <span className="text-xs">AI will auto-generate the scene prompt from your photo</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Channel</Label>
              <Select
                value={createForm.channelId || "global"}
                onValueChange={(v) => setCreateForm({ ...createForm, channelId: v === "global" ? "" : v })}
              >
                <SelectTrigger><SelectValue placeholder="Global (all channels)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global (all channels)</SelectItem>
                  {channels.map((ch) => (
                    <SelectItem key={ch.id} value={ch.id}>
                      <span className="flex items-center gap-2">
                        <span className={cn("text-[10px] px-1 rounded", universeColors[ch.universe] ?? "bg-zinc-700 text-zinc-400")}>U{ch.universe}</span>
                        {ch.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input required value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} placeholder="e.g. Kitchen Studio" />
              </div>
              <div className="space-y-1.5">
                <Label>Local / Hindi name</Label>
                <Input value={createForm.nameHindi} onChange={e => setCreateForm({ ...createForm, nameHindi: e.target.value })} placeholder="e.g. रसोई" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between mb-1">
                <Label>Scene Prompt</Label>
                {createImageUrl && !analyzingImage && (
                  <button
                    type="button"
                    onClick={async () => {
                      setAnalyzingImage(true);
                      try {
                        const channelNiche = channels.find((c) => c.id === createForm.channelId)?.niche;
                        const aiRes = await fetch("/api/locations/describe-image", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ imageUrl: createImageUrl, channelNiche }),
                        });
                        const aiData = await aiRes.json();
                        if (aiRes.ok) setCreateForm(prev => ({ ...prev, lockedVisualDesc: aiData.lockedVisualDesc ?? prev.lockedVisualDesc, description: aiData.description ?? prev.description, visualKeywords: aiData.visualKeywords ?? prev.visualKeywords }));
                      } finally { setAnalyzingImage(false); }
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                  >
                    <Sparkles className="h-3 w-3" /> Regenerate from image
                  </button>
                )}
              </div>
              <Textarea
                value={createForm.lockedVisualDesc}
                onChange={e => setCreateForm({ ...createForm, lockedVisualDesc: e.target.value })}
                rows={4}
                className={analyzingImage ? "opacity-50" : ""}
                placeholder={createImageUrl ? "AI is generating this from your image…" : "Upload an image above, or write a description manually — this is injected into every FAL video prompt for this location."}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} placeholder="Brief one-liner" />
              </div>
              <div className="space-y-1.5">
                <Label>Visual Keywords</Label>
                <Input value={createForm.visualKeywords} onChange={e => setCreateForm({ ...createForm, visualKeywords: e.target.value })} placeholder="e.g. kitchen, warm light" />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={creating || !createForm.name || analyzingImage || uploadingCreateImage}>
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Location
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LocationsPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" /></div>}>
      <LocationsContent />
    </Suspense>
  );
}

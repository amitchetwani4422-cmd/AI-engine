"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Upload, Trash2, Loader2, Image as ImageIcon, CheckCircle, RefreshCw, Lock } from "lucide-react";

interface LocationAsset {
  id: string;
  name: string;
  nameHindi: string;
  description: string;
  kandas: string[];
  referenceImages: string[];
  visualKeywords: string;
  lockedVisualDesc?: string;
  isVisualLocked?: boolean;
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<LocationAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState<Record<string, string>>({});
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  useEffect(() => { fetchLocations(); }, []);

  async function fetchLocations() {
    setLoading(true);
    try {
      const d = await fetch("/api/locations").then(r => r.json());
      setLocations(Array.isArray(d) ? d : []);
    } finally { setLoading(false); }
  }

  async function seedLocations() {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await fetch("/api/seed/ramayana", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSeedResult(`Done — ${data.locSeeded ?? 0} new, ${data.locUpdated ?? 0} updated with locked visuals`);
        await fetchLocations();
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
      fetchLocations();
    } finally { setUploading(null); }
  }

  async function removeImage(loc: LocationAsset, imageUrl: string) {
    await fetch("/api/locations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: loc.id, referenceImages: loc.referenceImages.filter(u => u !== imageUrl) }),
    });
    fetchLocations();
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Location References"
        description="Upload environment reference images for consistent scene backgrounds"
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={seedLocations}
            disabled={seeding}
          >
            {seeding
              ? <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> Seeding...</>
              : <><RefreshCw className="h-3 w-3 mr-1.5" /> Seed / Refresh Locations</>}
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        {seedResult && (
          <div className={`mb-4 px-4 py-2.5 rounded-lg text-sm border ${seedResult.startsWith("Error") ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-green-500/10 border-green-500/20 text-green-400"}`}>
            {seedResult}
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : locations.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 mb-2">No locations seeded yet</p>
            <p className="text-zinc-600 text-sm mb-4">Click "Seed / Refresh Locations" in the top-right to create all 12 Ramayana locations.</p>
            <Button onClick={seedLocations} disabled={seeding}>
              {seeding
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Seeding...</>
                : <><RefreshCw className="h-4 w-4 mr-2" /> Seed Locations Now</>}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {locations.map((loc) => (
              <Card key={loc.id} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-orange-400" />
                        <p className="font-medium text-zinc-100">{loc.name}</p>
                        {loc.referenceImages.length > 0 && (
                          <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                        )}
                      </div>
                      <p className="text-sm text-orange-300/70 mt-0.5">{loc.nameHindi}</p>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {loc.kandas.map(k => (
                        <Badge key={k} className="text-[10px] bg-zinc-800 text-zinc-400">{k}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-zinc-500">{loc.description}</p>

                  {/* Visual keywords */}
                  <p className="text-xs text-zinc-600 font-mono">{loc.visualKeywords}</p>

                  {/* Locked visual description */}
                  {loc.lockedVisualDesc && (
                    <div className="bg-amber-950/20 border border-amber-700/30 rounded-lg p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Lock className="h-3 w-3 text-amber-400" />
                        <span className="text-xs font-medium text-amber-400">Locked Visual Description</span>
                        {loc.isVisualLocked && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 ml-auto">Active</span>
                        )}
                      </div>
                      <p className="text-xs text-amber-200/70 leading-relaxed italic">"{loc.lockedVisualDesc}"</p>
                    </div>
                  )}

                  {/* Reference images */}
                  {loc.referenceImages.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {loc.referenceImages.map((url, i) => (
                        <div key={i} className="relative group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`${loc.name} reference ${i + 1}`}
                            className="w-20 h-14 object-cover rounded border border-zinc-700"
                          />
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

                  {/* Add image URL */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Paste image URL (Cloudinary, Midjourney, etc.)"
                      value={urlInput[loc.id] ?? ""}
                      onChange={e => setUrlInput(prev => ({ ...prev, [loc.id]: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && addImageUrl(loc)}
                      className="text-xs h-8"
                    />
                    <Button
                      size="sm"
                      className="h-8 px-3 shrink-0"
                      disabled={uploading === loc.id || !urlInput[loc.id]?.trim()}
                      onClick={() => addImageUrl(loc)}
                    >
                      {uploading === loc.id
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <><Upload className="h-3 w-3 mr-1" /> Add</>}
                    </Button>
                  </div>

                  {loc.referenceImages.length === 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                      <ImageIcon className="h-3 w-3" />
                      No reference image yet — scenes will use text-to-video
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

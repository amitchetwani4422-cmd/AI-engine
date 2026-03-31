"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Package, CheckCircle, Circle, ArrowRight } from "lucide-react";

interface Video {
  id: string; title: string; channelId: string; channel?: { name: string };
  status: string; formatVariant: string; thumbnailUrls: string[]; selectedThumbnail?: string;
  finalVideoUrl?: string; platform: string[];
  script?: { subtitleText?: string; description?: string; caption?: string; titleOptions: string[]; };
}

const CHECKLIST_ITEMS = [
  { key: "subtitle", label: "Subtitle file generated" },
  { key: "title", label: "Final title selected" },
  { key: "thumbnails", label: "Minimum 2 thumbnails prepared" },
  { key: "description", label: "YouTube description written" },
  { key: "caption", label: "Instagram caption written" },
  { key: "finalVideo", label: "Final video assembled" },
];

export default function PackagingPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Video | null>(null);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetch("/api/production?status=Packaging")
      .then((r) => r.json())
      .then((d) => setVideos(Array.isArray(d) ? d : d.videos ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selected) {
      setChecks({
        subtitle: !!selected.script?.subtitleText,
        title: !!selected.script?.titleOptions?.length,
        thumbnails: selected.thumbnailUrls.length >= 2,
        description: !!selected.script?.description,
        caption: !!selected.script?.caption,
        finalVideo: !!selected.finalVideoUrl,
      });
    }
  }, [selected]);

  async function sendToPublishing() {
    if (!selected) return;
    setApproving(true);
    try {
      await fetch(`/api/publishing/${selected.id}/approve`, { method: "POST" });
      setVideos((prev) => prev.filter((v) => v.id !== selected.id));
      setSelected(null);
    } finally { setApproving(false); }
  }

  const allChecked = Object.values(checks).every(Boolean);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header title="Packaging" subtitle="Prepare content for publishing" />
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-zinc-300">Ready for Packaging</h3>
              {videos.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-8">No videos pending packaging</p>
              ) : (
                videos.map((v) => (
                  <Card
                    key={v.id}
                    onClick={() => setSelected(v)}
                    className={`bg-zinc-900 border cursor-pointer transition-colors ${selected?.id === v.id ? "border-blue-600" : "border-zinc-800 hover:border-zinc-600"}`}
                  >
                    <CardContent className="p-3">
                      <p className="text-sm font-medium text-zinc-200">{v.title}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{v.channel?.name} · {v.formatVariant}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {selected && (
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-zinc-300">{selected.title}</h3>
                  <div className="flex gap-2">
                    {selected.platform.map((p) => <Badge key={p} className="bg-zinc-800 text-zinc-400">{p}</Badge>)}
                  </div>
                </div>

                {/* Checklist */}
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Packaging Checklist</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {CHECKLIST_ITEMS.map(({ key, label }) => (
                      <div
                        key={key}
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => setChecks({ ...checks, [key]: !checks[key] })}
                      >
                        {checks[key] ? (
                          <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-zinc-600 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${checks[key] ? "text-zinc-300 line-through text-zinc-600" : "text-zinc-300"}`}>{label}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Platform packaging */}
                <Tabs defaultValue="youtube">
                  <TabsList className="bg-zinc-900 border border-zinc-800">
                    <TabsTrigger value="youtube">YouTube Long-form</TabsTrigger>
                    <TabsTrigger value="shorts">Shorts</TabsTrigger>
                    <TabsTrigger value="instagram">Instagram Reel</TabsTrigger>
                  </TabsList>

                  <TabsContent value="youtube">
                    <Card className="bg-zinc-900 border-zinc-800">
                      <CardContent className="p-4 space-y-3 text-sm">
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">Title</p>
                          <p className="text-zinc-300">{selected.script?.titleOptions?.[0] ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">Description</p>
                          <p className="text-zinc-300 whitespace-pre-wrap">{selected.script?.description ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">Thumbnails</p>
                          {selected.thumbnailUrls.length > 0 ? (
                            <div className="flex gap-2">
                              {selected.thumbnailUrls.map((url, i) => (
                                <div key={i} className="w-24 h-14 bg-zinc-800 rounded border border-zinc-700 overflow-hidden">
                                  <img src={url} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          ) : <p className="text-zinc-600 italic text-xs">No thumbnails yet</p>}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="shorts">
                    <Card className="bg-zinc-900 border-zinc-800">
                      <CardContent className="p-4 text-sm text-zinc-400">
                        <p>Ensure the short-form variant has been produced with vertical 9:16 framing. Title should be under 60 characters. No end screen needed.</p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="instagram">
                    <Card className="bg-zinc-900 border-zinc-800">
                      <CardContent className="p-4 space-y-3 text-sm">
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">Caption</p>
                          <p className="text-zinc-300 whitespace-pre-wrap">{selected.script?.caption ?? "—"}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                <Button
                  className="w-full"
                  onClick={sendToPublishing}
                  disabled={!allChecked || approving}
                >
                  {approving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                  {allChecked ? "Send to Publishing" : `Complete checklist (${Object.values(checks).filter(Boolean).length}/${CHECKLIST_ITEMS.length})`}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

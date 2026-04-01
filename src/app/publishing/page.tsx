"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload, CheckCircle, Clock, XCircle, Eye } from "lucide-react";

interface Video {
  id: string; title: string; channelId: string; channel?: { name: string };
  status: string; formatVariant: string; thumbnailUrls: string[]; selectedThumbnail?: string;
  platform: string[]; publishedAt?: string; youtubeVideoId?: string; instagramPostId?: string;
  qualityScore?: number;
}

const STATUSES = ["ReadyToPublish", "Published", "Rejected"];

export default function PublishingPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ReadyToPublish");
  const [publishing, setPublishing] = useState<string | null>(null);

  useEffect(() => { fetchVideos(); }, []);

  async function fetchVideos() {
    setLoading(true);
    try {
      const d = await fetch("/api/publishing").then((r) => r.json());
      setVideos(Array.isArray(d) ? d : d.videos ?? []);
    } finally { setLoading(false); }
  }

  async function markPublished(videoId: string, platform: string) {
    setPublishing(videoId);
    try {
      await fetch(`/api/production/${videoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Published", publishedAt: new Date().toISOString() }),
      });
      fetchVideos();
    } finally { setPublishing(null); }
  }

  async function reject(videoId: string) {
    await fetch(`/api/production/${videoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Rejected" }),
    });
    fetchVideos();
  }

  const byStatus = (status: string) => videos.filter((v) => v.status === status);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header title="Publishing" description="Review, approve, and track video uploads" />
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-zinc-900 border border-zinc-800 mb-6">
              <TabsTrigger value="ReadyToPublish">Ready ({byStatus("ReadyToPublish").length})</TabsTrigger>
              <TabsTrigger value="Published">Published ({byStatus("Published").length})</TabsTrigger>
              <TabsTrigger value="Rejected">Rejected ({byStatus("Rejected").length})</TabsTrigger>
            </TabsList>

            <TabsContent value="ReadyToPublish">
              {byStatus("ReadyToPublish").length === 0 ? (
                <div className="text-center py-12">
                  <Upload className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-400">No videos ready to publish</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {byStatus("ReadyToPublish").map((v) => (
                    <Card key={v.id} className="bg-zinc-900 border-zinc-800">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {v.thumbnailUrls[0] && (
                            <img src={v.thumbnailUrls[0]} alt="thumbnail" className="w-24 h-14 object-cover rounded border border-zinc-700 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="font-medium text-zinc-100">{v.title}</p>
                              <Badge className="bg-green-500/20 text-green-400">Ready</Badge>
                              <Badge className="bg-zinc-800 text-zinc-400">{v.formatVariant}</Badge>
                            </div>
                            <p className="text-xs text-zinc-500 mb-2">{v.channel?.name}</p>
                            <div className="flex gap-1 mb-3">
                              {v.platform.map((p) => <Badge key={p} className="bg-zinc-800 text-zinc-400 text-xs">{p}</Badge>)}
                            </div>
                            {v.qualityScore && (
                              <p className="text-xs text-zinc-500">Quality Score: <span className="text-yellow-400">{v.qualityScore.toFixed(1)}</span></p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              onClick={() => markPublished(v.id, v.platform[0] ?? "youtube")}
                              disabled={publishing === v.id}
                            >
                              {publishing === v.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />}
                              Mark Published
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => reject(v.id)} className="text-red-400 hover:text-red-300">
                              <XCircle className="h-3 w-3 mr-1" /> Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="Published">
              {byStatus("Published").length === 0 ? (
                <p className="text-center text-zinc-500 py-12">No published videos yet</p>
              ) : (
                <div className="space-y-3">
                  {byStatus("Published").map((v) => (
                    <Card key={v.id} className="bg-zinc-900 border-zinc-800">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                              <p className="font-medium text-zinc-200 truncate">{v.title}</p>
                            </div>
                            <p className="text-xs text-zinc-500">
                              {v.channel?.name} · {v.publishedAt ? new Date(v.publishedAt).toLocaleDateString() : "—"}
                            </p>
                            <div className="flex gap-1 mt-1">
                              {v.platform.map((p) => <Badge key={p} className="bg-zinc-800 text-zinc-400 text-xs">{p}</Badge>)}
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => window.open(`https://studio.youtube.com`, "_blank")}>
                            <Eye className="h-3 w-3 mr-1" /> View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="Rejected">
              {byStatus("Rejected").length === 0 ? (
                <p className="text-center text-zinc-500 py-12">No rejected videos</p>
              ) : (
                <div className="space-y-3">
                  {byStatus("Rejected").map((v) => (
                    <Card key={v.id} className="bg-zinc-900 border-zinc-800">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-400" />
                          <p className="text-sm text-zinc-400">{v.title}</p>
                          <Badge className="bg-red-500/20 text-red-400 text-xs ml-auto">Rejected</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Star, CheckCircle, RefreshCw, AlertTriangle, XCircle, Play } from "lucide-react";

interface Video { id: string; title: string; channelId: string; channel?: { name: string }; status: string; finalVideoUrl?: string; }

const DIMENSIONS = [
  { key: "visualQuality", label: "Visual Quality" },
  { key: "characterConsistency", label: "Character Consistency" },
  { key: "storytellingClarity", label: "Storytelling Clarity" },
  { key: "hookStrength", label: "Hook Strength" },
  { key: "subtitleQuality", label: "Subtitle Quality" },
  { key: "voiceQuality", label: "Voice Quality" },
  { key: "lipSyncAccuracy", label: "Lip Sync Accuracy (Veo)" },
  { key: "thumbnailStrength", label: "Thumbnail & Title Strength" },
  { key: "platformFit", label: "Platform Fit" },
  { key: "musicFit", label: "Music Fit" },
  { key: "overallPublishWorthiness", label: "Overall Publish-Worthiness" },
];

type Scores = Record<string, number>;

function QualityPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedVideoId = searchParams.get("videoId");

  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [scores, setScores] = useState<Scores>(
    DIMENSIONS.reduce((acc, d) => ({ ...acc, [d.key]: 3 }), {})
  );
  const [result, setResult] = useState<{ outcome: string; avg: number } | null>(null);

  useEffect(() => {
    fetch("/api/production?status=QualityCheck")
      .then((r) => r.json())
      .then((d) => {
        const vids = Array.isArray(d) ? d : d.videos ?? [];
        setVideos(vids);
        if (preselectedVideoId) {
          const found = vids.find((v: Video) => v.id === preselectedVideoId);
          if (found) setSelectedVideo(found);
        }
      })
      .finally(() => setLoading(false));
  }, [preselectedVideoId]);

  const avg = Object.values(scores).reduce((a, b) => a + b, 0) / DIMENSIONS.length;

  const getOutcome = (score: number) => {
    if (score >= 4.5) return { label: "Approve", color: "text-green-400", icon: <CheckCircle className="h-5 w-5" /> };
    if (score >= 3.5) return { label: "Revise", color: "text-yellow-400", icon: <RefreshCw className="h-5 w-5" /> };
    if (score >= 2.5) return { label: "Regenerate", color: "text-orange-400", icon: <AlertTriangle className="h-5 w-5" /> };
    return { label: "Discard", color: "text-red-400", icon: <XCircle className="h-5 w-5" /> };
  };

  const outcome = getOutcome(avg);

  async function submitReview() {
    if (!selectedVideo) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/production/${selectedVideo.id}/quality-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores }),
      });
      const data = await res.json();
      setResult({ outcome: data.outcome ?? outcome.label, avg });
    } finally { setSubmitting(false); }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header title="Quality Scorecard" description="Review videos before approval" />
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video selector */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-zinc-300">Videos Pending Review</h3>
              {videos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-zinc-500 text-sm">No videos awaiting quality check</p>
                </div>
              ) : (
                videos.map((v) => (
                  <Card
                    key={v.id}
                    onClick={() => { setSelectedVideo(v); setResult(null); }}
                    className={`bg-zinc-900 border cursor-pointer transition-colors ${selectedVideo?.id === v.id ? "border-blue-600" : "border-zinc-800 hover:border-zinc-600"}`}
                  >
                    <CardContent className="p-3">
                      <p className="text-sm font-medium text-zinc-200">{v.title}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{v.channel?.name}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Scoring panel */}
            {selectedVideo && !result && (
              <div className="lg:col-span-2 space-y-4">
                {/* Assembled video player */}
                {selectedVideo.finalVideoUrl ? (
                  <div className="rounded-xl overflow-hidden border border-zinc-700 bg-black">
                    <video
                      src={selectedVideo.finalVideoUrl}
                      controls
                      autoPlay={false}
                      playsInline
                      className="w-full max-h-72 object-contain"
                    />
                    <div className="px-3 py-2 flex items-center gap-2 bg-zinc-900 border-t border-zinc-800">
                      <Play className="h-3 w-3 text-green-400" />
                      <span className="text-xs text-green-400 font-medium">Assembled video ready — watch before scoring</span>
                      <a
                        href={selectedVideo.finalVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-xs text-zinc-500 hover:text-zinc-300 underline"
                      >
                        Open full screen
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-6 text-center">
                    <p className="text-sm text-zinc-500">No assembled video yet — go back to Production and click <strong className="text-zinc-300">Assemble Final Video</strong></p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-zinc-300">Scoring: {selectedVideo.title}</h3>
                  <div className={`flex items-center gap-2 ${outcome.color}`}>
                    {outcome.icon}
                    <span className="text-sm font-medium">{outcome.label} ({avg.toFixed(1)})</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {DIMENSIONS.map(({ key, label }) => (
                    <div key={key} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-zinc-300">{label}</span>
                        <span className="text-sm font-bold text-zinc-100 w-6 text-center">{scores[key]}</span>
                      </div>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            key={val}
                            onClick={() => setScores({ ...scores, [key]: val })}
                            className={`flex-1 h-8 rounded text-xs font-medium transition-colors ${
                              scores[key] === val
                                ? val >= 4 ? "bg-green-600 text-white" : val >= 3 ? "bg-yellow-600 text-white" : "bg-red-600 text-white"
                                : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Overall score */}
                <Card className="bg-zinc-800/50 border-zinc-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-zinc-300">Average Score</span>
                      <span className={`text-2xl font-bold ${outcome.color}`}>{avg.toFixed(2)}</span>
                    </div>
                    <Progress value={(avg / 5) * 100} className="h-2 mb-2" />
                    <div className="flex gap-3 text-xs text-zinc-500 mt-1">
                      <span className="text-green-400">≥4.5 Approve</span>
                      <span className="text-yellow-400">3.5-4.4 Revise</span>
                      <span className="text-orange-400">2.5-3.4 Regenerate</span>
                      <span className="text-red-400">&lt;2.5 Discard</span>
                    </div>
                  </CardContent>
                </Card>

                <Button className="w-full" onClick={submitReview} disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Star className="h-4 w-4 mr-2" />}
                  Submit Quality Review
                </Button>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="lg:col-span-2 flex flex-col items-center justify-center py-12 gap-4">
                <div className={`text-5xl font-bold ${getOutcome(result.avg).color}`}>{result.avg.toFixed(2)}</div>
                <Badge className={`text-lg px-4 py-2 ${
                  result.outcome === "Approve" ? "bg-green-500/20 text-green-400" :
                  result.outcome === "Revise" ? "bg-yellow-500/20 text-yellow-400" :
                  result.outcome === "Regenerate" ? "bg-orange-500/20 text-orange-400" :
                  "bg-red-500/20 text-red-400"
                }`}>{result.outcome}</Badge>
                <p className="text-zinc-400 text-sm">Quality review submitted</p>
                <div className="flex gap-3">
                  {result.outcome === "Approve" && (
                    <Button onClick={() => router.push("/packaging")}>Go to Packaging</Button>
                  )}
                  {result.outcome === "Revise" && (
                    <Button variant="outline" onClick={() => router.push(`/production/${selectedVideo?.id}`)}>Back to Production</Button>
                  )}
                  <Button variant="ghost" onClick={() => { setResult(null); setSelectedVideo(null); }}>Review Another</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function QualityPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="text-zinc-500">Loading...</div></div>}>
      <QualityPageInner />
    </Suspense>
  );
}

"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  Play,
  Music,
  Camera,
  List,
  DollarSign,
  Video,
} from "lucide-react";

interface Scene {
  id: string;
  sequenceNumber: number;
  description: string;
  duration: number;
  modelAssigned: string;
  routingReason?: string;
  cameraDirection?: string;
  visualGuidance?: string;
  prompt?: string;
  status: string;
}

interface Script {
  id: string;
  title: string;
  hook: string;
  fullScript: string;
  narrationDraft?: string;
  formatVariant: string;
  musicMood: string;
  thumbnailConcepts: Array<{ concept: string; description: string }>;
  titleOptions: string[];
  subtitleText?: string;
  description?: string;
  caption?: string;
  status: string;
  channelId: string;
  channel?: { name: string; niche: string };
  sceneBreakdown: Scene[];
  createdAt: string;
}

const modelStyle: Record<string, string> = {
  "kling-3.0": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "veo-3.1": "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export default function ScriptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [script, setScript] = useState<Script | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [startingProd, setStartingProd] = useState(false);

  useEffect(() => {
    fetch(`/api/scripts/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) setScript(d); })
      .finally(() => setLoading(false));
  }, [id]);

  async function approveScript() {
    setApproving(true);
    try {
      const res = await fetch(`/api/scripts/${id}/approve`, { method: "POST" });
      if (res.ok) {
        const updated = await fetch(`/api/scripts/${id}`).then((r) => r.json());
        if (updated && !updated.error) setScript(updated);
      }
    } finally {
      setApproving(false);
    }
  }

  async function startProduction() {
    setStartingProd(true);
    try {
      const res = await fetch("/api/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptId: id, channelId: script?.channelId }),
      });
      if (res.ok) {
        const video = await res.json();
        router.push(`/production/${video.id}`);
      }
    } finally {
      setStartingProd(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!script) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-400">Script not found</p>
        <Button variant="ghost" onClick={() => router.push("/scripts")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>
    );
  }

  const klingScenes = script.sceneBreakdown.filter((s) => s.modelAssigned === "kling-3.0");
  const veoScenes = script.sceneBreakdown.filter((s) => s.modelAssigned === "veo-3.1");
  const totalDuration = script.sceneBreakdown.reduce((sum, s) => sum + s.duration, 0);
  const estKlingCost = klingScenes.reduce((sum, s) => sum + s.duration * 0.04, 0);
  const estVeoCost = veoScenes.reduce((sum, s) => sum + s.duration * 0.08, 0);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title={script.title}
        description={`${script.channel?.name ?? ""} · ${script.formatVariant}`}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => router.push("/scripts")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            {script.status === "Draft" && (
              <Button variant="outline" onClick={approveScript} disabled={approving}>
                {approving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Approve Script
              </Button>
            )}
            {script.status === "Approved" && (
              <Button onClick={startProduction} disabled={startingProd}>
                {startingProd ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                Start Production
              </Button>
            )}
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        {/* Status + Cost Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-zinc-500 mb-1">Status</p>
              <Badge className={
                script.status === "Approved" ? "bg-green-500/20 text-green-400" :
                script.status === "Draft" ? "bg-zinc-700 text-zinc-300" :
                "bg-yellow-500/20 text-yellow-400"
              }>{script.status}</Badge>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-zinc-500 mb-1">Total Duration</p>
              <p className="text-sm font-medium text-zinc-200">{Math.floor(totalDuration / 60)}m {totalDuration % 60}s</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-zinc-500 mb-1">Kling / Veo Scenes</p>
              <p className="text-sm font-medium">
                <span className="text-blue-400">{klingScenes.length}</span>
                <span className="text-zinc-600"> / </span>
                <span className="text-purple-400">{veoScenes.length}</span>
              </p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-zinc-500 mb-1">Est. Cost</p>
              <p className="text-sm font-medium text-green-400">${(estKlingCost + estVeoCost).toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="scenes">Scenes ({script.sceneBreakdown.length})</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle className="text-sm">Hook</CardTitle></CardHeader>
              <CardContent>
                <p className="text-zinc-200 font-medium">{script.hook}</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle className="text-sm">Full Script</CardTitle></CardHeader>
              <CardContent>
                <pre className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed font-sans">{script.fullScript}</pre>
              </CardContent>
            </Card>

            {script.narrationDraft && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader><CardTitle className="text-sm">Narration Draft</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{script.narrationDraft}</p>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader><CardTitle className="text-sm">Title Options</CardTitle></CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {script.titleOptions.map((title, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-zinc-600 font-mono">{i + 1}.</span>
                        <span className="text-zinc-300">{title}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Music className="h-4 w-4" /> Music Mood</CardTitle></CardHeader>
                <CardContent>
                  <Badge className="bg-zinc-800 text-zinc-300 text-sm px-3 py-1">{script.musicMood}</Badge>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle className="text-sm">Thumbnail Concepts</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(Array.isArray(script.thumbnailConcepts) ? script.thumbnailConcepts : []).map((concept, i) => (
                    <div key={i} className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                      <p className="text-xs text-zinc-500 mb-1">Variant {i + 1}</p>
                      <p className="text-sm text-zinc-300">{typeof concept === "string" ? concept : concept.description ?? JSON.stringify(concept)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scenes Tab */}
          <TabsContent value="scenes" className="space-y-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-xs text-zinc-400">Kling 3.0 — {klingScenes.length} scenes (${estKlingCost.toFixed(2)})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-xs text-zinc-400">Veo 3.1 — {veoScenes.length} scenes (${estVeoCost.toFixed(2)})</span>
              </div>
            </div>

            {script.sceneBreakdown.map((scene) => (
              <Card key={scene.id} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-xs font-mono text-zinc-400">
                      {scene.sequenceNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge className={`text-xs border ${modelStyle[scene.modelAssigned] ?? "bg-zinc-800 text-zinc-400"}`}>
                          {scene.modelAssigned}
                        </Badge>
                        <span className="text-xs text-zinc-500">{scene.duration}s</span>
                        {scene.routingReason && (
                          <span className="text-xs text-zinc-600">· {scene.routingReason}</span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-300 mb-2">{scene.description}</p>
                      {scene.cameraDirection && (
                        <p className="text-xs text-zinc-500 flex items-center gap-1">
                          <Camera className="h-3 w-3" /> {scene.cameraDirection}
                        </p>
                      )}
                      {scene.prompt && (
                        <div className="mt-2 bg-zinc-800/50 rounded p-2">
                          <p className="text-xs text-zinc-600 mb-1">Generation Prompt:</p>
                          <p className="text-xs text-zinc-400 font-mono">{scene.prompt}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="space-y-3 text-sm">
                  {script.description && (
                    <div>
                      <p className="text-zinc-500 text-xs mb-1">YouTube Description</p>
                      <p className="text-zinc-300 whitespace-pre-wrap">{script.description}</p>
                    </div>
                  )}
                  {script.caption && (
                    <div>
                      <p className="text-zinc-500 text-xs mb-1">Instagram Caption</p>
                      <p className="text-zinc-300">{script.caption}</p>
                    </div>
                  )}
                  {script.subtitleText && (
                    <div>
                      <p className="text-zinc-500 text-xs mb-1">Subtitle Text</p>
                      <p className="text-zinc-300 whitespace-pre-wrap">{script.subtitleText}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

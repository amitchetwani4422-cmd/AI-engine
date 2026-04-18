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
  Mic,
  Copy,
  Download,
  RefreshCw,
} from "lucide-react";

interface VoiceScriptLine {
  lineNumber: string;
  timestamp: string;
  sceneName: string;
  voiceDirection: string;
  scriptText: string;
  elevenLabsSettings: {
    stability: number;
    similarityBoost: number;
    style: number;
    speakerBoost: boolean;
  };
}

interface VoiceScript {
  episodeTitle: string;
  language: string;
  voiceDescription: string;
  platform: string;
  totalDurationMins: string;
  defaultSettings: {
    stability: number;
    similarityBoost: number;
    style: number;
    speakerBoost: boolean;
    model: string;
  };
  lines: VoiceScriptLine[];
}

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
  const [voiceScript, setVoiceScript] = useState<VoiceScript | null>(null);
  const [generatingVS, setGeneratingVS] = useState(false);
  const [vsCopied, setVsCopied] = useState(false);

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

  async function generateVoiceScript() {
    setGeneratingVS(true);
    try {
      const res = await fetch(`/api/scripts/${id}/voice-script`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await res.json();
      if (res.ok) setVoiceScript(data);
    } finally {
      setGeneratingVS(false);
    }
  }

  function copyVoiceScript() {
    if (!voiceScript) return;
    const text = [
      `DOCUMENT 2 — VOICE SCRIPT FOR 11LABS`,
      `Episode: ${voiceScript.episodeTitle}`,
      `Language: ${voiceScript.language} | Voice: ${voiceScript.voiceDescription} | Platform: ${voiceScript.platform} | Total Duration: ${voiceScript.totalDurationMins}`,
      ``,
      `11LABS SETTINGS`,
      `Stability: ${voiceScript.defaultSettings.stability} | Similarity Boost: ${voiceScript.defaultSettings.similarityBoost} | Style: ${voiceScript.defaultSettings.style} | Speaker Boost: ${voiceScript.defaultSettings.speakerBoost ? "ON" : "OFF"} | Model: ${voiceScript.defaultSettings.model}`,
      ``,
      voiceScript.lines.map((l: VoiceScriptLine) =>
        `[${l.lineNumber}] ${l.timestamp} | ${l.sceneName}\nVoice: ${l.voiceDirection}\nScript: ${l.scriptText}\n11Labs: Stability ${l.elevenLabsSettings.stability} | SimilarityBoost ${l.elevenLabsSettings.similarityBoost} | Style ${l.elevenLabsSettings.style}`
      ).join("\n\n"),
    ].join("\n");
    navigator.clipboard.writeText(text);
    setVsCopied(true);
    setTimeout(() => setVsCopied(false), 2000);
  }

  function downloadVoiceScript() {
    if (!voiceScript) return;
    const data = JSON.stringify(voiceScript, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voice-script-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
            <TabsTrigger value="voice-script" className="flex items-center gap-1.5">
              <Mic className="h-3.5 w-3.5" /> Voice Script
            </TabsTrigger>
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

          {/* Voice Script Tab */}
          <TabsContent value="voice-script" className="space-y-4">
            {!voiceScript ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Mic className="h-10 w-10 text-zinc-600" />
                <p className="text-zinc-400 text-sm">Generate the ElevenLabs voice script for this episode</p>
                <Button onClick={generateVoiceScript} disabled={generatingVS}>
                  {generatingVS
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                    : <><Mic className="h-4 w-4 mr-2" /> Generate Voice Script</>}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header card */}
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Document 2 — Voice Script for 11Labs</p>
                        <p className="font-semibold text-zinc-100">Episode: {voiceScript.episodeTitle}</p>
                        <p className="text-sm text-zinc-400 mt-0.5">
                          Language: {voiceScript.language} · Voice: {voiceScript.voiceDescription} · Platform: {voiceScript.platform} · Duration: {voiceScript.totalDurationMins}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button size="sm" variant="outline" onClick={generateVoiceScript} disabled={generatingVS}>
                          {generatingVS ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                        </Button>
                        <Button size="sm" variant="outline" onClick={copyVoiceScript}>
                          <Copy className="h-3.5 w-3.5 mr-1.5" />{vsCopied ? "Copied!" : "Copy"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={downloadVoiceScript}>
                          <Download className="h-3.5 w-3.5 mr-1.5" />JSON
                        </Button>
                      </div>
                    </div>

                    {/* 11Labs default settings bar */}
                    <div className="bg-zinc-800/60 rounded-lg px-3 py-2 text-xs text-zinc-400 flex flex-wrap gap-x-4 gap-y-1">
                      <span className="font-medium text-zinc-300">11Labs Settings</span>
                      <span>Stability: <span className="text-zinc-200">{voiceScript.defaultSettings.stability}</span></span>
                      <span>Similarity Boost: <span className="text-zinc-200">{voiceScript.defaultSettings.similarityBoost}</span></span>
                      <span>Style: <span className="text-zinc-200">{voiceScript.defaultSettings.style}</span></span>
                      <span>Speaker Boost: <span className="text-zinc-200">{voiceScript.defaultSettings.speakerBoost ? "ON" : "OFF"}</span></span>
                      <span>Model: <span className="text-zinc-200">{voiceScript.defaultSettings.model}</span></span>
                    </div>
                  </CardContent>
                </Card>

                {/* Voice script table */}
                <div className="overflow-x-auto rounded-lg border border-zinc-800">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-amber-900/40 text-amber-200 text-xs uppercase tracking-wide">
                        <th className="px-3 py-2.5 text-left font-semibold w-12">Line</th>
                        <th className="px-3 py-2.5 text-left font-semibold w-28">Timestamp</th>
                        <th className="px-3 py-2.5 text-left font-semibold w-24">Scene</th>
                        <th className="px-3 py-2.5 text-left font-semibold w-64">Voice Direction (11Labs)</th>
                        <th className="px-3 py-2.5 text-left font-semibold">Script</th>
                      </tr>
                    </thead>
                    <tbody>
                      {voiceScript.lines.map((line: VoiceScriptLine, i: number) => (
                        <tr
                          key={i}
                          className={`border-t border-zinc-800 align-top ${i % 2 === 0 ? "bg-zinc-900" : "bg-zinc-900/50"}`}
                        >
                          <td className="px-3 py-3 font-mono text-amber-400 font-semibold">{line.lineNumber}</td>
                          <td className="px-3 py-3 text-zinc-500 text-xs whitespace-nowrap">{line.timestamp}</td>
                          <td className="px-3 py-3 font-medium text-zinc-300 text-xs">{line.sceneName}</td>
                          <td className="px-3 py-3 text-zinc-400 text-xs leading-relaxed">
                            <p className="mb-2">{line.voiceDirection}</p>
                            <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-zinc-600">
                              <span>S:{line.elevenLabsSettings.stability}</span>
                              <span>SB:{line.elevenLabsSettings.similarityBoost}</span>
                              <span>St:{line.elevenLabsSettings.style}</span>
                              <span className={line.elevenLabsSettings.speakerBoost ? "text-green-600" : "text-red-600"}>
                                Boost:{line.elevenLabsSettings.speakerBoost ? "ON" : "OFF"}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-zinc-200 text-sm leading-relaxed">{line.scriptText}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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

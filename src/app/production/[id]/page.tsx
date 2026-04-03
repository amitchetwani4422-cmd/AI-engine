"use client";

import React, { useEffect, useState, use, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Loader2,
  Play,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Zap,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const VIDEO_STYLES = [
  { value: "cinematic-vfx", label: "🎬 Cinematic VFX", prefix: "Photorealistic cinematic, Hollywood VFX, 8K ultra-detailed, dramatic lighting," },
  { value: "mythology-fantasy", label: "🔱 Mythology Fantasy", prefix: "Epic Indian mythology art style, divine celestial VFX, glowing auras, sacred geometry, ultra-detailed," },
  { value: "animated-3d", label: "🎨 Animated 3D", prefix: "High-quality 3D animation, Pixar/DreamWorks style, vibrant colors, smooth motion," },
  { value: "anime", label: "⚡ Anime / 2D", prefix: "Japanese anime style, 2D animation, expressive characters, dynamic action lines," },
  { value: "documentary", label: "📷 Documentary Realism", prefix: "Realistic documentary style, natural lighting, handheld camera feel, authentic," },
  { value: "none", label: "✏️ Use AI Prompt As-Is", prefix: "" },
] as const;

type VideoStyleValue = typeof VIDEO_STYLES[number]["value"];

interface GeneratedClip {
  id: string;
  clipUrl: string;
  model: string;
  duration: number;
  cost: number;
  isApproved: boolean;
  status: string;
}

interface Scene {
  id: string;
  sequenceNumber: number;
  description: string;
  duration: number;
  modelAssigned: string;
  routingReason?: string;
  status: string;
  generatedClips: GeneratedClip[];
}

interface ProductionVideo {
  id: string;
  title: string;
  status: string;
  channelId: string;
  channel?: { name: string };
  totalCost: number;
  klingCost: number;
  veoCost: number;
  qualityScore?: number;
  formatVariant: string;
  script?: { sceneBreakdown: Scene[] };
  generatedClips: GeneratedClip[];
}

const modelStyle: Record<string, string> = {
  "kling-3.0": "bg-blue-500/20 text-blue-400",
  "veo-3.1": "bg-purple-500/20 text-purple-400",
};

const sceneStatusIcon = {
  Pending: <Clock className="h-4 w-4 text-zinc-500" />,
  Generating: <Loader2 className="h-4 w-4 text-yellow-400 animate-spin" />,
  Approved: <CheckCircle className="h-4 w-4 text-green-400" />,
  Failed: <XCircle className="h-4 w-4 text-red-400" />,
};

export default function ProductionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [video, setVideo] = useState<ProductionVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingScene, setGeneratingScene] = useState<string | null>(null);
  const [sceneError, setSceneError] = useState<string | null>(null);
  const [videoStyle, setVideoStyle] = useState<VideoStyleValue>("mythology-fantasy");
  const [budgetMode, setBudgetMode] = useState(true);
  const [feedbackOpen, setFeedbackOpen] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState<Record<string, string>>({});
  const [customPrompt, setCustomPrompt] = useState<Record<string, string>>({});
  const [queue, setQueue] = useState<string[]>([]); // scene IDs waiting to generate
  const [queueRunning, setQueueRunning] = useState(false);
  const [movingToQC, setMovingToQC] = useState(false);
  const [assembling, setAssembling] = useState(false);
  const [assembleError, setAssembleError] = useState<string | null>(null);
  const generatingRef = useRef(false);

  useEffect(() => {
    fetchVideo();
  }, [id]);

  async function fetchVideo() {
    try {
      const res = await fetch(`/api/production/${id}`);
      const data = await res.json();
      if (data && !data.error) setVideo(data);
    } finally {
      setLoading(false);
    }
  }

  const runScene = useCallback(async (sceneId: string, feedback?: string, promptOverride?: string) => {
    if (generatingRef.current) return;
    generatingRef.current = true;
    setGeneratingScene(sceneId);
    setSceneError(null);
    setFeedbackOpen(null);
    try {
      const stylePrefix = VIDEO_STYLES.find((s) => s.value === videoStyle)?.prefix ?? "";
      const res = await fetch(`/api/production/${id}/generate-scene`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sceneId,
          stylePrefix,
          forceKling: budgetMode,
          feedback: feedback || undefined,
          promptOverride: promptOverride || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchVideo();
      } else {
        const msg = data?.details ?? data?.error ?? `Error ${res.status}`;
        setSceneError(
          msg.includes("FAL") || msg.includes("credentials") || msg.includes("401") || msg.includes("Unauthorized")
            ? "FAL.AI not configured. Add FAL_KEY to Vercel environment variables to generate video scenes."
            : msg
        );
        // On error, clear the rest of the queue
        setQueue([]);
        setQueueRunning(false);
      }
    } catch {
      setSceneError("Network error — please try again.");
      setQueue([]);
      setQueueRunning(false);
    } finally {
      generatingRef.current = false;
      setGeneratingScene(null);
    }
  }, [id, videoStyle, budgetMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Queue processor — runs next scene automatically when one finishes
  useEffect(() => {
    if (!queueRunning || generatingRef.current || queue.length === 0) return;
    const [next, ...rest] = queue;
    setQueue(rest);
    runScene(next).then(() => {
      if (rest.length === 0) setQueueRunning(false);
    });
  }, [queue, queueRunning, runScene]);

  function generateScene(sceneId: string, feedback?: string, promptOverride?: string) {
    runScene(sceneId, feedback, promptOverride);
  }

  function startQueue(sceneIds: string[]) {
    if (sceneIds.length === 0) return;
    setSceneError(null);
    const [first, ...rest] = sceneIds;
    setQueue(rest);
    setQueueRunning(true);
    runScene(first).then(() => {
      if (rest.length === 0) setQueueRunning(false);
    });
  }

  function cancelQueue() {
    setQueue([]);
    setQueueRunning(false);
  }

  async function assembleVideo() {
    setAssembling(true);
    setAssembleError(null);
    try {
      const res = await fetch(`/api/production/${id}/assemble`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        await fetchVideo();
        router.push(`/quality?videoId=${id}`);
      } else {
        setAssembleError(data.details ?? data.error ?? "Assembly failed");
      }
    } finally {
      setAssembling(false);
    }
  }

  async function moveToQualityCheck() {
    setMovingToQC(true);
    try {
      const res = await fetch(`/api/production/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "QualityCheck" }),
      });
      if (res.ok) {
        router.push(`/quality?videoId=${id}`);
      }
    } finally {
      setMovingToQC(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-400">Video not found</p>
        <Button variant="ghost" onClick={() => router.push("/production")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>
    );
  }

  const scenes = video.script?.sceneBreakdown ?? [];
  const generatedScenes = scenes.filter((s) => s.generatedClips.length > 0);
  const progress = scenes.length > 0 ? (generatedScenes.length / scenes.length) * 100 : 0;
  const allScenesGenerated = scenes.length > 0 && generatedScenes.length >= scenes.length;
  const klingScenes = scenes.filter((s) => s.modelAssigned === "kling-3.0");
  const veoScenes = scenes.filter((s) => s.modelAssigned === "veo-3.1");

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title={video.title}
        description={video.channel?.name ?? ""}
        actions={
          <div className="flex gap-2 items-center">
            <Button variant="ghost" onClick={() => router.push("/production")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            {allScenesGenerated && video.status !== "Assembling" && (
              <Button onClick={assembleVideo} disabled={assembling} className="bg-blue-600 hover:bg-blue-700">
                {assembling
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Assembling (~2 min)...</>
                  : video.finalVideoUrl
                    ? <><Zap className="h-4 w-4 mr-2" /> Re-assemble</>
                    : <><Zap className="h-4 w-4 mr-2" /> Assemble Final Video</>}
              </Button>
            )}
            {video.status === "Assembling" && (
              <div className="flex items-center gap-2 text-yellow-400 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Assembling with FFmpeg...
              </div>
            )}
            {video.finalVideoUrl && (
              <Button variant="outline" asChild>
                <a href={video.finalVideoUrl} target="_blank" rel="noopener noreferrer">
                  <Play className="h-4 w-4 mr-2" /> Watch Final Video
                </a>
              </Button>
            )}
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        {sceneError && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
            <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{sceneError}</span>
          </div>
        )}
        {assembleError && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            Assembly failed: {assembleError}
          </div>
        )}
        {video.finalVideoUrl && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Final video assembled and ready. <a href={video.finalVideoUrl} target="_blank" rel="noopener noreferrer" className="underline">Watch it here</a>
          </div>
        )}
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-zinc-500 mb-1">Status</p>
              <Badge className="bg-yellow-500/20 text-yellow-400">{video.status}</Badge>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-zinc-500 mb-1">Progress</p>
              <p className="text-sm font-medium text-zinc-200">{generatedScenes.length}/{scenes.length} scenes</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-zinc-500 mb-1">Model Split</p>
              <p className="text-sm">
                <span className="text-blue-400">{klingScenes.length}K</span>
                <span className="text-zinc-600"> / </span>
                <span className="text-purple-400">{veoScenes.length}V</span>
              </p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-zinc-500 mb-1">Total Cost</p>
              <p className="text-sm font-medium text-green-400">{formatCurrency(video.totalCost)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
            <span>Generation Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Cost Breakdown */}
        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-6">
                <div>
                  <p className="text-xs text-zinc-500">Kling 3.0 Cost</p>
                  <p className="text-lg font-medium text-blue-400">{formatCurrency(video.klingCost)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Veo 3.1 Cost</p>
                  <p className="text-lg font-medium text-purple-400">{formatCurrency(video.veoCost)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Total</p>
                  <p className="text-lg font-medium text-green-400">{formatCurrency(video.totalCost)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Video Style + Budget Selector */}
        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardContent className="p-4">
            {/* Budget Mode Toggle */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-800">
              <div>
                <p className="text-sm font-medium text-zinc-200">Budget Mode</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Forces all scenes to use <span className="text-blue-400">Kling 3.0</span> (~$0.25–0.50/scene).
                  Disable only if you need Veo2 lip-sync (<span className="text-red-400">~$1.50/scene</span>).
                </p>
              </div>
              <button
                onClick={() => setBudgetMode(!budgetMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${budgetMode ? "bg-green-600" : "bg-zinc-600"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${budgetMode ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            <div className="flex items-start gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200 mb-1">Video Style</p>
                <p className="text-xs text-zinc-500 mb-3">
                  Choose the visual style. This is prepended to every scene prompt sent to the AI video model.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {VIDEO_STYLES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setVideoStyle(s.value)}
                      className={`px-3 py-2 rounded-lg text-xs text-left transition-all border ${
                        videoStyle === s.value
                          ? "bg-blue-600/20 border-blue-500/50 text-blue-300"
                          : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              {VIDEO_STYLES.find((s) => s.value === videoStyle)?.prefix && (
                <div className="w-full sm:w-64 bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                  <p className="text-xs text-zinc-500 mb-1">Prompt prefix added:</p>
                  <p className="text-xs text-zinc-400 italic leading-relaxed">
                    "{VIDEO_STYLES.find((s) => s.value === videoStyle)?.prefix}"
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scenes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-medium text-zinc-300">Scene Generation</h3>
              {video.finalVideoUrl && (
                <p className="text-xs text-yellow-400 mt-0.5">
                  Video assembled — regenerate any scene then Re-assemble to update
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {queueRunning && (
                <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>
                    Generating scene {scenes.filter(s => s.generatedClips.length > 0).length + 1}/{scenes.length}
                    {queue.length > 0 && ` · ${queue.length} queued`}
                  </span>
                  <button onClick={cancelQueue} className="ml-1 text-zinc-400 hover:text-zinc-200 underline">
                    Cancel
                  </button>
                </div>
              )}
              {!queueRunning && scenes.some(s => s.generatedClips.length === 0) && (
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    const pending = scenes.filter(s => s.generatedClips.length === 0).map(s => s.id);
                    startQueue(pending);
                  }}
                  disabled={!!generatingScene}
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Generate All ({scenes.filter(s => s.generatedClips.length === 0).length} remaining)
                </Button>
              )}
            </div>
          </div>
          {scenes.length === 0 && (
            <p className="text-sm text-zinc-500 italic">No scenes found. Ensure script has a scene breakdown.</p>
          )}
          {scenes.map((scene) => {
            const isGenerating = generatingScene === scene.id;
            const isQueued = queue.includes(scene.id);
            const clip = scene.generatedClips[0] ?? null;
            const isFeedbackOpen = feedbackOpen === scene.id;
            return (
              <Card key={scene.id} className={`border ${clip ? "bg-zinc-900 border-zinc-700" : "bg-zinc-900 border-zinc-800"}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded flex items-center justify-center text-xs font-mono flex-shrink-0 ${clip ? "bg-green-900/40 text-green-400" : "bg-zinc-800 text-zinc-400"}`}>
                      {clip ? <CheckCircle className="h-3.5 w-3.5" /> : scene.sequenceNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-medium text-zinc-400">Scene {scene.sequenceNumber}</span>
                        <Badge className={`text-xs ${modelStyle[scene.modelAssigned] ?? "bg-zinc-800 text-zinc-400"}`}>
                          {budgetMode ? "kling-3.0" : scene.modelAssigned}
                        </Badge>
                        <span className="text-xs text-zinc-500">{scene.duration}s</span>
                      </div>
                      <p className="text-sm text-zinc-300 mb-2">{scene.description}</p>

                      {/* Current prompt (collapsible) */}
                      {scene.prompt && (
                        <details className="mb-2">
                          <summary className="text-xs text-zinc-600 cursor-pointer hover:text-zinc-400 select-none">
                            View AI prompt
                          </summary>
                          <p className="text-xs text-zinc-500 mt-1 font-mono leading-relaxed bg-zinc-800/40 rounded p-2">
                            {scene.prompt}
                          </p>
                        </details>
                      )}

                      {/* Clip preview */}
                      {clip && !isGenerating && (
                        <div className="space-y-2 mt-2">
                          <video
                            src={clip.clipUrl}
                            controls
                            preload="none"
                            playsInline
                            className="w-full max-w-md rounded-lg border border-zinc-700"
                            style={{ maxHeight: "200px" }}
                          />
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="flex items-center gap-1 text-xs text-green-400">
                              <CheckCircle className="h-3 w-3" /> Clip ready · {formatCurrency(clip.cost)}
                            </span>
                            <button
                              onClick={() => setFeedbackOpen(isFeedbackOpen ? null : scene.id)}
                              className="text-xs text-zinc-400 hover:text-zinc-200 underline"
                            >
                              Not happy? Give feedback &amp; regenerate
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Feedback panel */}
                      {isFeedbackOpen && (
                        <div className="mt-3 space-y-2 bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                          <p className="text-xs font-medium text-zinc-300">What&apos;s wrong with this clip?</p>
                          <textarea
                            className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-xs text-zinc-200 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-zinc-500"
                            rows={2}
                            placeholder="e.g. Too dark, characters look wrong, camera angle should be wider, add more fire effects..."
                            value={feedbackText[scene.id] ?? ""}
                            onChange={(e) => setFeedbackText((p) => ({ ...p, [scene.id]: e.target.value }))}
                          />
                          <p className="text-xs font-medium text-zinc-300 pt-1">Or write a custom prompt directly:</p>
                          <textarea
                            className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-xs text-zinc-200 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-zinc-500"
                            rows={2}
                            placeholder="Leave blank to let the system adjust the original prompt based on your feedback above..."
                            value={customPrompt[scene.id] ?? ""}
                            onChange={(e) => setCustomPrompt((p) => ({ ...p, [scene.id]: e.target.value }))}
                          />
                          <div className="flex gap-2 pt-1">
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => generateScene(scene.id, feedbackText[scene.id], customPrompt[scene.id])}
                              disabled={isGenerating || !!generatingScene}
                            >
                              <Zap className="h-3 w-3 mr-1" /> Regenerate with Feedback
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setFeedbackOpen(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {isGenerating && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-yellow-400">
                          <Loader2 className="h-3 w-3 animate-spin" /> Generating clip (~30–60s)...
                        </div>
                      )}
                      {isQueued && !isGenerating && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-blue-400">
                          <Clock className="h-3 w-3" /> Queued — waiting for previous scene to finish
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {!clip && !isGenerating && !isQueued && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateScene(scene.id)}
                          disabled={!!generatingScene || queueRunning}
                        >
                          <Zap className="h-3 w-3 mr-1" /> Generate
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState, use } from "react";
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
  const [movingToQC, setMovingToQC] = useState(false);

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

  async function generateScene(sceneId: string) {
    setGeneratingScene(sceneId);
    try {
      const res = await fetch(`/api/production/${id}/generate-scene`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sceneId }),
      });
      if (res.ok) {
        await fetchVideo();
      }
    } finally {
      setGeneratingScene(null);
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
  const approvedScenes = scenes.filter((s) => s.status === "Approved" || s.generatedClips.some((c) => c.isApproved));
  const progress = scenes.length > 0 ? (approvedScenes.length / scenes.length) * 100 : 0;
  const klingScenes = scenes.filter((s) => s.modelAssigned === "kling-3.0");
  const veoScenes = scenes.filter((s) => s.modelAssigned === "veo-3.1");

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title={video.title}
        description={video.channel?.name ?? ""}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => router.push("/production")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            {progress >= 100 && video.status !== "QualityCheck" && (
              <Button onClick={moveToQualityCheck} disabled={movingToQC}>
                {movingToQC ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Send to Quality Check
              </Button>
            )}
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-6">
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
              <p className="text-sm font-medium text-zinc-200">{approvedScenes.length}/{scenes.length} scenes</p>
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

        {/* Scenes */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-300">Scene Generation</h3>
          {scenes.length === 0 && (
            <p className="text-sm text-zinc-500 italic">No scenes found. Ensure script has a scene breakdown.</p>
          )}
          {scenes.map((scene) => {
            const approvedClip = scene.generatedClips.find((c) => c.isApproved);
            const isGenerating = generatingScene === scene.id;
            return (
              <Card key={scene.id} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded bg-zinc-800 flex items-center justify-center text-xs font-mono text-zinc-400 flex-shrink-0">
                      {scene.sequenceNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge className={`text-xs ${modelStyle[scene.modelAssigned] ?? "bg-zinc-800 text-zinc-400"}`}>
                          {scene.modelAssigned}
                        </Badge>
                        <span className="text-xs text-zinc-500">{scene.duration}s</span>
                        {sceneStatusIcon[scene.status as keyof typeof sceneStatusIcon] ?? null}
                      </div>
                      <p className="text-sm text-zinc-300 mb-2">{scene.description}</p>

                      {approvedClip ? (
                        <div className="flex items-center gap-2 text-xs text-green-400">
                          <CheckCircle className="h-3 w-3" />
                          <span>Clip generated · {formatCurrency(approvedClip.cost)}</span>
                        </div>
                      ) : scene.generatedClips.length > 0 ? (
                        <div className="flex items-center gap-2 text-xs text-yellow-400">
                          <Clock className="h-3 w-3" />
                          <span>{scene.generatedClips.length} clip(s) — pending approval</span>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex-shrink-0">
                      {!approvedClip && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateScene(scene.id)}
                          disabled={isGenerating || !!generatingScene}
                        >
                          {isGenerating ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Zap className="h-3 w-3 mr-1" />
                          )}
                          {isGenerating ? "Generating..." : "Generate"}
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

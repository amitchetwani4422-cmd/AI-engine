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
  Mic,
  Volume2,
  Shuffle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const VIDEO_STYLES = [
  {
    value: "ramayana-divine",
    label: "🔱 Divine / Palace (recommended)",
    prefix: "Photorealistic live-action ancient India, real actors in hand-embroidered silk and real gold jewellery, volumetric saffron god-rays streaming through carved Nagara stone pillars, golden sacred dust motes suspended in divine light, divine celestial aura glowing around figures,",
  },
  {
    value: "ramayana-battle",
    label: "⚔️ Battle / Epic War",
    prefix: "Epic cinematic ancient Indian battlefield, photorealistic warriors in authentic bronze-age armour and leather, towering fire columns and battle smoke creating crimson-and-smoke-purple sky, dramatic directional raking light catching weapon edges and armour detail, raw visceral motion and scale,",
  },
  {
    value: "ramayana-devotional",
    label: "🪔 Devotional / Emotional",
    prefix: "Intimate cinematic devotional moment, photorealistic divine figures with sacred aura, warm ghee-lamp and camphor-flame light casting golden glow on faces, sacred incense smoke curling upward, loose lotus petals drifting in still sacred air, deeply emotional and spiritually charged atmosphere,",
  },
  {
    value: "ramayana-reveal",
    label: "✨ Epic Divine Reveal",
    prefix: "Cinematic wide-angle divine epic reveal, photorealistic ancient India massive scale, celestial white light descending from parting clouds illuminating the divine figure, camera slowly pulling back to reveal full magnificent scale, awe-inspiring sacred grandeur,",
  },
  {
    value: "ramayana-forest",
    label: "🌿 Forest / Exile / Nature",
    prefix: "Cinematic ancient Indian forest, photorealistic actors in forest-dweller attire against towering ancient trees, dappled amber-gold god-ray shafts filtering through emerald forest canopy, mist between ancient roots, sacred wilderness of Treta Yuga India,",
  },
  { value: "none", label: "✏️ Use Prompt As-Is", prefix: "" },
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
  cameraDirection?: string;
  visualGuidance?: string;
  prompt?: string;
  promptEn?: string;
  narrationText?: string;
  dialogues?: { character: string; text: string }[];
  sceneAudio?: string;
  sceneAudioPublicId?: string;
  locationTag?: string;
  status: string;
  characters?: { id: string; name: string }[];
  generatedClips: GeneratedClip[];
}

interface VoiceAsset {
  id: string;
  name: string;
  language: string;
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
  finalVideoUrl?: string;
  script?: { sceneBreakdown: Scene[] };
  generatedClips: GeneratedClip[];
}

const modelStyle: Record<string, string> = {
  "kling-3.0":   "bg-blue-500/20 text-blue-400",
  "veo-3.1":     "bg-purple-500/20 text-purple-400",
  "ltx-video-2": "bg-green-500/20 text-green-400",
  "wan-2.1":     "bg-orange-500/20 text-orange-400",
};

const MODEL_OPTIONS = [
  { value: "ltx-video-2", label: "LTX-Video 2", badge: "~$0.02/5s" },
  { value: "wan-2.1",     label: "Wan 2.1",     badge: "~$0.015/5s" },
  { value: "kling-3.0",  label: "Kling 1.6 Pro", badge: "~$0.28/5s" },
  { value: "veo-3.1",    label: "Veo 3.1",      badge: "~$0.40/5s" },
];

// Human-readable shot type info per model (for the scene cards)
const MODEL_META: Record<string, { shotType: string; icon: string; price: string; colorClass: string; bgClass: string }> = {
  "ltx-video-2": { shotType: "Wide / Landscape",  icon: "🌅", price: "~$0.02", colorClass: "text-green-400",  bgClass: "bg-green-500/10 border-green-500/20" },
  "wan-2.1":     { shotType: "Mid / Exterior",     icon: "🌲", price: "~$0.02", colorClass: "text-orange-400", bgClass: "bg-orange-500/10 border-orange-500/20" },
  "kling-3.0":   { shotType: "Close-up / Hero",    icon: "👁",  price: "~$0.28", colorClass: "text-blue-400",   bgClass: "bg-blue-500/10 border-blue-500/20" },
  "veo-3.1":     { shotType: "Divine / Cinematic", icon: "✨", price: "~$0.40", colorClass: "text-purple-400", bgClass: "bg-purple-500/10 border-purple-500/20" },
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
  const [rescuingScene, setRescuingScene] = useState<string | null>(null);
  const [rescueMsg, setRescueMsg] = useState<Record<string, string>>({});
  const [videoStyle, setVideoStyle] = useState<VideoStyleValue>("ramayana-divine"); // default: divine/palace
  const [budgetMode, setBudgetMode] = useState(false); // false = smart routing per scene; true = force all to Kling
  const [feedbackOpen, setFeedbackOpen] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState<Record<string, string>>({});
  const [sceneModels, setSceneModels] = useState<Record<string, string>>({});
  const [customPrompt, setCustomPrompt] = useState<Record<string, string>>({});
  const [queue, setQueue] = useState<string[]>([]); // scene IDs waiting to generate
  const [queueRunning, setQueueRunning] = useState(false);
  const [movingToQC, setMovingToQC] = useState(false);
  const [assembling, setAssembling] = useState(false);
  const [assembleError, setAssembleError] = useState<string | null>(null);
  const [rerouting, setRerouting] = useState(false);
  const [rerouteResult, setRerouteResult] = useState<string | null>(null);
  const [voiceAssets, setVoiceAssets] = useState<VoiceAsset[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("");
  const [generatingVoices, setGeneratingVoices] = useState(false);
  const [generatingSceneVoice, setGeneratingSceneVoice] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceResult, setVoiceResult] = useState<{ generated: number; totalDialogues: number; narratorName: string } | null>(null);
  const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({});
  const [lockingBackground, setLockingBackground] = useState<string | null>(null); // sceneId
  const [lockedBg, setLockedBg] = useState<Record<string, string>>({}); // sceneId → locationName
  const [backfillingChars, setBackfillingChars] = useState(false);
  const [backfillResult, setBackfillResult] = useState<string | null>(null);
  // Bug 2 fix: per-scene generating set instead of a single shared boolean ref.
  const generatingRef = useRef<Set<string>>(new Set());

  // Preview-before-generate state
  type CharacterPreview = { id: string | null; name: string; imageUrl: string | null; hasImage: boolean; inDb: boolean; isMatched: boolean; };
  type GeneratePreview = {
    sceneId: string; sceneName: string; mode: string; readyToGenerate: boolean;
    locationTag: string | null; locationRefImage: string | null;
    characters: CharacterPreview[]; missingImages: CharacterPreview[];
    characterSource: string;
    prompt: string; promptLength: number;
    feedback?: string; promptOverride?: string;
  };
  const [generatePreview, setGeneratePreview] = useState<GeneratePreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null);
  const rescueTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const queueCancelledRef = useRef(false);

  async function fetchVideo() {
    try {
      const res = await fetch(`/api/production/${id}`);
      const data = await res.json();
      if (data && !data.error) { setVideo(data); return data; }
    } finally {
      setLoading(false);
    }
    return null;
  }

  async function backfillCharacters() {
    setBackfillingChars(true);
    setBackfillResult(null);
    try {
      const res = await fetch(`/api/production/${id}/backfill-characters`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        const d = data.debug;
        const debugLine = d
          ? ` | Channel chars: ${d.charactersFoundInChannel} (${d.characterNames.join(', ') || 'none'}) | Sample text: "${d.sampleSceneText?.slice(0, 120)}"`
          : '';
        setBackfillResult(data.message + debugLine);
        await fetchVideo();
      } else {
        setBackfillResult(`Error: ${data.error}`);
      }
    } catch (e) {
      setBackfillResult(`Error: ${String(e)}`);
    } finally {
      setBackfillingChars(false);
    }
  }

  async function rerouteScenes() {
    setRerouting(true);
    setRerouteResult(null);
    try {
      const res = await fetch(`/api/production/${id}/reroute-scenes`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        const s = data.summary as Record<string, number>;
        const parts = Object.entries(s).map(([model, count]) => `${count}× ${model}`).join(", ");
        setRerouteResult(`Rerouted ${data.total} scenes — ${parts}`);
        await fetchVideo();
      } else {
        setRerouteResult(`Error: ${data.error}`);
      }
    } catch (e) {
      setRerouteResult(`Error: ${String(e)}`);
    } finally {
      setRerouting(false);
    }
  }

  async function fetchVoiceAssets(channelId: string) {
    try {
      const res = await fetch(`/api/voice?channelId=${channelId}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setVoiceAssets(data);
        setSelectedVoiceId(data[0].id);
      }
    } catch { /* ignore */ }
  }

  async function generateAllVoices() {
    if (!video) return;
    setGeneratingVoices(true);
    setVoiceError(null);
    setVoiceResult(null);
    try {
      const res = await fetch(`/api/production/${id}/generate-voices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceAssetId: selectedVoiceId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setVoiceError(data.error ?? "Voice generation failed"); return; }
      setVoiceResult({ generated: data.generated, totalDialogues: data.totalDialogues, narratorName: data.narratorName });
      await fetchVideo();
    } catch (err) {
      setVoiceError(String(err));
    } finally {
      setGeneratingVoices(false);
    }
  }

  async function generateSceneVoice(sceneId: string) {
    setGeneratingSceneVoice(sceneId);
    setVoiceError(null);
    try {
      const res = await fetch(`/api/production/${id}/generate-voices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceAssetId: selectedVoiceId || undefined, sceneIds: [sceneId] }),
      });
      const data = await res.json();
      if (!res.ok) { setVoiceError(data.error ?? "Voice generation failed"); return; }
      await fetchVideo();
    } catch (err) {
      setVoiceError(String(err));
    } finally {
      setGeneratingSceneVoice(null);
    }
  }

  // Auto-rescue a stuck scene: check FAL status, recover clip if done, retry every 2 min if still processing
  const scheduleAutoRescue = useCallback((sceneId: string) => {
    if (rescueTimers.current[sceneId]) clearTimeout(rescueTimers.current[sceneId]);
    rescueTimers.current[sceneId] = setTimeout(async () => {
      try {
        const res = await fetch(`/api/production/${id}/rescue-scene`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sceneId }),
        });
        const data = await res.json();
        if (data.status === "rescued") {
          const latest = await fetch(`/api/production/${id}`);
          const latest_data = await latest.json();
          if (latest_data && !latest_data.error) setVideo(latest_data);
          setRescueMsg((p) => ({ ...p, [sceneId]: "" }));
        } else if (data.status === "still_processing") {
          setRescueMsg((p) => ({ ...p, [sceneId]: "⏳ FAL still generating — auto-checking in 2 min..." }));
          scheduleAutoRescue(sceneId); // retry in 2 min
        } else {
          // failed or error — leave scene card showing the state
          setRescueMsg((p) => ({ ...p, [sceneId]: data.error ?? "Could not recover — try Recover Clip button." }));
        }
      } catch {
        scheduleAutoRescue(sceneId); // network blip — retry
      }
    }, 120_000); // 2 minutes
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // On load: auto-resume polling if page was refreshed during generation
  useEffect(() => {
    fetchVideo().then((data) => {
      if (!data) return;
      if (data.channelId) fetchVoiceAssets(data.channelId);
      type SceneRow = { id: string; status: string; generatedClips: unknown[] };
      const inProgress: SceneRow[] = (data.script?.sceneBreakdown ?? []).filter(
        (s: SceneRow) => s.status === "Generating" && s.generatedClips.length === 0
      );
      if (inProgress.length === 0) return;
      // Don't set generatingScene here — it would disable all other scenes' Regenerate buttons.
      // The stuck scene already shows its orange "Recover Clip" UI from DB status === "Generating".
      // Background rescue: quietly check FAL and recover if done.
      Promise.all(
        inProgress.map((s) =>
          pollForClip(s.id).then(async (ok) => {
            if (!ok) {
              // Poll timed out — auto-rescue instead of showing error
              try {
                const res = await fetch(`/api/production/${id}/rescue-scene`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ sceneId: s.id }),
                });
                const rdata = await res.json();
                if (rdata.status === "rescued") {
                  const latest = await fetch(`/api/production/${id}`);
                  const ldata = await latest.json();
                  if (ldata && !ldata.error) setVideo(ldata);
                } else if (rdata.status === "still_processing") {
                  setRescueMsg((p) => ({ ...p, [s.id]: "⏳ FAL still generating — auto-checking in 2 min..." }));
                  scheduleAutoRescue(s.id);
                }
              } catch { /* network error — scene card shows Recover button */ }
            }
          })
        )
      );
    });
    return () => {
      // Cleanup auto-rescue timers on unmount
      Object.values(rescueTimers.current).forEach(clearTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Poll for a scene's clip to appear (webhook async flow)
  const pollForClip = useCallback(async (sceneId: string): Promise<boolean> => {
    for (let i = 0; i < 60; i++) { // up to 5 minutes (60 × 5s)
      await new Promise((r) => setTimeout(r, 5000));
      const res = await fetch(`/api/production/${id}`);
      const data = await res.json();
      const scene = data?.script?.sceneBreakdown?.find((s: { id: string }) => s.id === sceneId);
      if (scene?.generatedClips?.length > 0) {
        setVideo(data);
        return true;
      }
      // Check if scene failed
      if (scene?.status === "Failed") return false;
    }
    return false;
  }, [id]);

  const runScene = useCallback(async (sceneId: string, feedback?: string, promptOverride?: string, forceRetranslate?: boolean) => {
    if (generatingRef.current.has(sceneId)) return;
    generatingRef.current.add(sceneId);
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
          modelOverride: sceneModels[sceneId] || undefined,
          feedback: feedback || undefined,
          promptOverride: promptOverride || undefined,
          forceRetranslate: forceRetranslate || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok || res.status === 202) {
        // Queued — poll until webhook delivers the clip
        const success = await pollForClip(sceneId);
        if (!success) {
          // Poll timed out — don't show error yet. Auto-rescue first.
          // FAL may have finished but webhook couldn't reach us (NEXT_PUBLIC_APP_URL issue).
          try {
            const rres = await fetch(`/api/production/${id}/rescue-scene`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sceneId }),
            });
            const rdata = await rres.json();
            if (rdata.status === "rescued") {
              // Clip recovered silently — no user action needed, queue continues
              const latest = await fetch(`/api/production/${id}`);
              const ldata = await latest.json();
              if (ldata && !ldata.error) setVideo(ldata);
              return; // don't clear queue — let it continue
            } else if (rdata.status === "still_processing") {
              setRescueMsg((p) => ({ ...p, [sceneId]: "⏳ FAL still generating — auto-checking in 2 min..." }));
              scheduleAutoRescue(sceneId);
            } else if (rdata.status === "failed") {
              setRescueMsg((p) => ({ ...p, [sceneId]: "❌ FAL job failed — safe to regenerate (no double charge)." }));
            } else {
              setRescueMsg((p) => ({ ...p, [sceneId]: "Could not check status — use Recover Clip button." }));
            }
          } catch {
            setRescueMsg((p) => ({ ...p, [sceneId]: "Network error checking FAL — use Recover Clip button." }));
          }
          setQueue([]);
          setQueueRunning(false);
        }
      } else {
        const msg = data?.details ?? data?.error ?? `Error ${res.status}`;
        setSceneError(
          msg.includes("NEXT_PUBLIC_APP_URL")
            ? "Add NEXT_PUBLIC_APP_URL=https://your-app.vercel.app to Vercel environment variables."
            : msg.includes("FAL") || msg.includes("credentials") || msg.includes("401")
            ? "FAL.AI not configured. Add FAL_KEY to Vercel environment variables."
            : msg
        );
        setQueue([]);
        setQueueRunning(false);
      }
    } catch {
      setSceneError("Network error — please try again.");
      setQueue([]);
      setQueueRunning(false);
    } finally {
      generatingRef.current.delete(sceneId);
      setGeneratingScene(null);
    }
  }, [id, videoStyle, budgetMode, pollForClip, scheduleAutoRescue]); // eslint-disable-line react-hooks/exhaustive-deps

  // Step 1: fetch preview → show dialog. User confirms → step 2 runs the actual generation.
  async function generateScene(sceneId: string, feedback?: string, promptOverride?: string, sceneName?: string) {
    setLoadingPreview(sceneId);
    try {
      const res = await fetch(`/api/production/${id}/preview-prompt?sceneId=${sceneId}`);
      const data = await res.json();
      if (!res.ok) {
        setSceneError(data.error ?? 'Failed to load preview');
        return;
      }
      setGeneratePreview({
        ...data,
        sceneId,
        sceneName: sceneName || `Scene`,
        feedback,
        promptOverride,
      });
    } catch {
      setSceneError('Network error loading preview');
    } finally {
      setLoadingPreview(null);
    }
  }

  function confirmGenerate() {
    if (!generatePreview) return;
    const { sceneId, feedback, promptOverride } = generatePreview;
    setGeneratePreview(null);
    const forceRetranslate = !!(feedback?.trim());
    runScene(sceneId, feedback, promptOverride, forceRetranslate);
  }

  function startQueue(sceneIds: string[]) {
    if (sceneIds.length === 0) return;
    setSceneError(null);
    setQueueRunning(true);
    queueCancelledRef.current = false;
    setQueue(sceneIds);

    // Simple sequential async loop — no useEffect needed.
    // useEffect approach had a bug: after runScene finished, none of the effect
    // dependencies changed so React never re-fired it to pick up the next scene.
    (async () => {
      for (const sceneId of sceneIds) {
        if (queueCancelledRef.current) break;
        setQueue((prev) => prev.filter((id) => id !== sceneId));
        await runScene(sceneId);
      }
      setQueueRunning(false);
      setQueue([]);
      queueCancelledRef.current = false;
    })();
  }

  function cancelQueue() {
    queueCancelledRef.current = true;
    setQueue([]);
    setQueueRunning(false);
  }

  async function rescueScene(sceneId: string) {
    setRescuingScene(sceneId);
    setRescueMsg((p) => ({ ...p, [sceneId]: "Checking FAL status..." }));
    try {
      const res = await fetch(`/api/production/${id}/rescue-scene`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sceneId }),
      });
      const data = await res.json();
      if (data.status === "rescued") {
        await fetchVideo();
        setRescueMsg((p) => ({ ...p, [sceneId]: "" }));
      } else if (data.status === "still_processing") {
        setRescueMsg((p) => ({ ...p, [sceneId]: "⏳ Still generating on FAL. Check again in 1–2 min." }));
      } else if (data.status === "failed") {
        setRescueMsg((p) => ({ ...p, [sceneId]: "❌ FAL job failed. Safe to regenerate (no double charge)." }));
      } else {
        setRescueMsg((p) => ({ ...p, [sceneId]: data.error ?? "Could not recover. Try regenerating." }));
      }
    } catch {
      setRescueMsg((p) => ({ ...p, [sceneId]: "Network error. Try again." }));
    } finally {
      setRescuingScene(null);
    }
  }

  async function assembleVideo() {
    // Warn if scenes have narration text but no audio has been generated
    const scenesWithText = (video?.script?.sceneBreakdown ?? []).filter(
      (s) => s.narrationText?.trim() || (s.dialogues && s.dialogues.length > 0)
    );
    const scenesWithAudio = scenesWithText.filter((s) => s.sceneAudio);
    if (scenesWithText.length > 0 && scenesWithAudio.length === 0) {
      const proceed = window.confirm(
        `No voice audio has been generated yet.\n\n` +
        `${scenesWithText.length} scene(s) have narration/dialogue text but no audio.\n\n` +
        `The assembled video will be SILENT.\n\n` +
        `Click OK to assemble without audio, or Cancel to generate voices first (use the Voice panel above).`
      );
      if (!proceed) return;
    }

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

  // Extract Cloudinary still frame from a video URL (so_0 = first frame)
  function cloudinaryThumbnail(videoUrl: string): string {
    // Transform: /video/upload/.../<id>.mp4 → /video/upload/so_0/<id>.jpg
    return videoUrl.replace(/\/video\/upload\//, "/video/upload/so_0/").replace(/\.[^.]+$/, ".jpg");
  }

  async function lockBackground(scene: Scene, clipUrl: string) {
    if (!scene.locationTag) return;
    setLockingBackground(scene.id);
    try {
      const imageUrl = cloudinaryThumbnail(clipUrl);
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationName: scene.locationTag, imageUrl }),
      });
      if (res.ok) {
        setLockedBg((p) => ({ ...p, [scene.id]: scene.locationTag! }));
      }
    } finally {
      setLockingBackground(null);
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
  const ltxScenes = scenes.filter((s) => s.modelAssigned === "ltx-video-2");
  const wanScenes = scenes.filter((s) => s.modelAssigned === "wan-2.1");

  // ── Generate Preview Dialog ───────────────────────────────────────────────
  const PreviewDialog = generatePreview ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setGeneratePreview(null)}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-100">Preview — {generatePreview.sceneName}</h2>
            <button onClick={() => setGeneratePreview(null)} className="text-zinc-500 hover:text-zinc-300 text-lg leading-none">×</button>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            {generatePreview.mode === 'image-mode' ? '🖼 Image-to-video — character image sent as reference frame' : '📝 Text-to-video — appearance described in prompt'}
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* Characters — always shown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-zinc-400">Characters detected</p>
              <span className="text-xs text-zinc-600">{generatePreview.characterSource}</span>
            </div>
            {generatePreview.characters.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {generatePreview.characters.map((c, i) => (
                  <div key={c.id ?? i} className="flex flex-col items-center gap-1.5 w-20">
                    {c.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.imageUrl} alt={c.name} className="w-20 h-20 rounded-lg object-cover border border-green-700/50" />
                    ) : (
                      <div className={`w-20 h-20 rounded-lg flex flex-col items-center justify-center gap-1 border border-dashed ${c.inDb ? 'bg-zinc-800 border-amber-700/50' : 'bg-zinc-800/50 border-zinc-600'}`}>
                        <span className="text-2xl">👤</span>
                        <span className={`text-[10px] ${c.inDb ? 'text-amber-500' : 'text-zinc-600'}`}>
                          {c.inDb ? 'No image' : 'Not created'}
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-zinc-300 font-medium text-center leading-tight">{c.name}</span>
                    {c.inDb && c.id ? (
                      <a href={`/characters/${c.id}`} target="_blank" rel="noreferrer"
                        className="text-[10px] text-amber-400 hover:text-amber-300 underline text-center">
                        {c.hasImage ? 'View →' : 'Add image →'}
                      </a>
                    ) : (
                      <a href="/characters" target="_blank" rel="noreferrer"
                        className="text-[10px] text-blue-400 hover:text-blue-300 underline text-center">
                        Create →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-xs text-zinc-500 italic">
                No Ramayana characters detected in scene text
              </div>
            )}
          </div>

          {/* Location — always shown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-zinc-400">
                Location: <span className="text-zinc-300">{generatePreview.locationTag ?? 'not tagged'}</span>
              </p>
              {generatePreview.locationTag && (
                <a
                  href={`/locations?highlight=${encodeURIComponent(generatePreview.locationTag)}`}
                  target="_blank" rel="noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 underline"
                >
                  {generatePreview.locationRefImage ? 'Manage →' : 'Add image →'}
                </a>
              )}
            </div>
            {generatePreview.locationTag ? (
              generatePreview.locationRefImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={generatePreview.locationRefImage} alt={generatePreview.locationTag} className="h-24 rounded-lg object-cover border border-zinc-700 w-full" />
              ) : (
                <div className="bg-zinc-800/60 border border-dashed border-zinc-600 rounded-lg p-3 flex items-center justify-between">
                  <p className="text-xs text-zinc-500 italic">No reference image — using text description</p>
                  <a href={`/locations?highlight=${encodeURIComponent(generatePreview.locationTag)}`} target="_blank" rel="noreferrer" className="text-xs text-amber-400 hover:text-amber-300 underline ml-3 shrink-0">
                    Add image →
                  </a>
                </div>
              )
            ) : (
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-xs text-zinc-500 italic">
                Scene has no location tag — regenerate script to assign one
              </div>
            )}
          </div>

          {/* Prompt */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-medium text-zinc-400">Prompt being sent to FAL</p>
              <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${generatePreview.promptLength > 800 ? 'bg-red-900/40 text-red-400' : 'bg-zinc-800 text-zinc-500'}`}>
                {generatePreview.promptLength} chars
              </span>
            </div>
            <p className="text-xs text-zinc-400 bg-zinc-800 rounded-lg p-3 leading-relaxed font-mono whitespace-pre-wrap">{generatePreview.prompt}</p>
          </div>

          {/* Missing images warning */}
          {generatePreview.missingImages.length > 0 && (
            <div className="bg-amber-950/40 border border-amber-800/50 rounded-lg p-3">
              <p className="text-xs text-amber-400 font-medium mb-1">⚠ Missing approved images</p>
              <p className="text-xs text-amber-500/80">
                {generatePreview.missingImages.map((c) => c.name).join(', ')} {generatePreview.missingImages.length === 1 ? 'has' : 'have'} no approved image.
                Click the character name above to add one, then regenerate.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-zinc-800 flex gap-3">
          <Button variant="outline" size="sm" className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800" onClick={() => setGeneratePreview(null)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className={`flex-1 ${generatePreview.readyToGenerate ? 'bg-blue-600 hover:bg-blue-700' : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'}`}
            disabled={!generatePreview.readyToGenerate}
            onClick={confirmGenerate}
          >
            <Zap className="h-3.5 w-3.5 mr-1.5" />
            {generatePreview.readyToGenerate ? 'Confirm & Generate' : 'Add images first'}
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {PreviewDialog}
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
        {sceneError && !sceneError.startsWith("scene:") && (
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
        {voiceError && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <XCircle className="h-4 w-4 flex-shrink-0" />
            <span>Voice: {voiceError}</span>
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
              <p className="text-xs flex flex-wrap gap-x-1.5 gap-y-0.5 justify-center">
                {ltxScenes.length > 0 && <span className="text-green-400">{ltxScenes.length} LTX</span>}
                {wanScenes.length > 0 && <span className="text-orange-400">{wanScenes.length} Wan</span>}
                {klingScenes.length > 0 && <span className="text-blue-400">{klingScenes.length} Kling</span>}
                {veoScenes.length > 0 && <span className="text-purple-400">{veoScenes.length} Veo</span>}
                {ltxScenes.length + wanScenes.length + klingScenes.length + veoScenes.length === 0 && <span className="text-zinc-600">—</span>}
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
            {/* Smart Routing / Force Kling Toggle */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-800">
              <div>
                <p className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                  {budgetMode
                    ? <><span className="text-blue-400">⚡ Force Kling</span> — all scenes use Kling 1.6 Pro</>
                    : <><span className="text-green-400">✦ Smart Routing</span> — each scene uses the best model for its shot type</>}
                </p>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  {budgetMode
                    ? "All scenes → Kling 1.6 Pro (~$0.28/5s). Override smart routing."
                    : <span>
                        <span className="text-green-400">🌅 Wide shots → LTX2 (~$0.02)</span>
                        {" · "}
                        <span className="text-orange-400">🌲 Mid shots → Wan (~$0.02)</span>
                        {" · "}
                        <span className="text-blue-400">👁 Close-ups → Kling (~$0.28)</span>
                        {" — AI assigned per scene"}
                      </span>}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-zinc-500">{budgetMode ? "Force Kling" : "Smart"}</span>
                <button
                  onClick={() => setBudgetMode(!budgetMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${budgetMode ? "bg-blue-600" : "bg-green-600"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${budgetMode ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
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

        {/* Voice Generation Panel — always visible so user knows audio step exists */}
        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                  <Mic className="h-4 w-4 text-purple-400" /> Voice Narration + Character Dialogues
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Generate narrator audio + character-specific voices before assembly — otherwise the final video will be <span className="text-yellow-400 font-medium">silent</span>.
                  Background music is auto-selected from the script mood.
                </p>
                {voiceResult && (
                  <p className="text-xs text-green-400 mt-1">
                    Done — {voiceResult.generated} scenes voiced · {voiceResult.totalDialogues} dialogue lines · narrator: {voiceResult.narratorName}
                  </p>
                )}
                {scenes.filter(s => s.sceneAudio).length > 0 && !voiceResult && (
                  <p className="text-xs text-purple-400 mt-1">
                    {scenes.filter(s => s.sceneAudio).length}/{scenes.length} scenes voiced
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {voiceAssets.length === 0 && (
                  <span className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1.5 rounded">
                    No voice asset — <a href="/voice" className="underline hover:text-yellow-200">create one in Voice &amp; Audio</a>
                  </span>
                )}
                {voiceAssets.length > 1 && (
                  <select
                    value={selectedVoiceId}
                    onChange={(e) => setSelectedVoiceId(e.target.value)}
                    className="text-xs px-2 py-1.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-200"
                  >
                    {voiceAssets.map((v) => (
                      <option key={v.id} value={v.id}>{v.name} ({v.language})</option>
                    ))}
                  </select>
                )}
                {voiceAssets.length === 1 && (
                  <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1.5 rounded border border-zinc-700">
                    {voiceAssets[0].name}
                  </span>
                )}
                {voiceAssets.length > 0 && (
                  <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={generateAllVoices}
                    disabled={generatingVoices}
                  >
                    {generatingVoices
                      ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Generating voices...</>
                      : <><Mic className="h-3 w-3 mr-1" /> Generate All Voices</>}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scenes */}
        <div className="space-y-3">
          {backfillResult && (
            <div className={`px-4 py-2.5 rounded-lg text-sm border ${backfillResult.startsWith("Error") ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}>
              {backfillResult}
            </div>
          )}
          {rerouteResult && (
            <div className={`px-4 py-2.5 rounded-lg text-sm border ${rerouteResult.startsWith("Error") ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-green-500/10 border-green-500/20 text-green-400"}`}>
              {rerouteResult}
            </div>
          )}
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
              {/* Link characters: re-scans scene text and populates characterIds */}
              <Button
                size="sm"
                variant="outline"
                className="border-amber-700/50 text-amber-400 hover:text-amber-200"
                onClick={backfillCharacters}
                disabled={backfillingChars || queueRunning}
                title="Re-scan each scene's text and link the correct characters from DB"
              >
                {backfillingChars
                  ? <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> Linking...</>
                  : <>Link Characters</>}
              </Button>
              {/* Auto-route: re-analyses scene text and assigns LTX2/Wan/Kling per scene */}
              <Button
                size="sm"
                variant="outline"
                className="border-zinc-700 text-zinc-400 hover:text-zinc-200"
                onClick={rerouteScenes}
                disabled={rerouting || queueRunning}
                title="Analyse each scene and assign the cheapest suitable model (Wide→LTX2, Mid→Wan, Close-up→Kling)"
              >
                {rerouting
                  ? <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> Routing...</>
                  : <><Shuffle className="h-3 w-3 mr-1.5" /> Auto-Route Models</>}
              </Button>
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
                      {/* Scene header: shot type badge + generate button */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-mono text-zinc-500">#{scene.sequenceNumber}</span>
                        {/* Shot type + model badge */}
                        {(() => {
                          const activeModel = budgetMode ? "kling-3.0" : (sceneModels[scene.id] ?? scene.modelAssigned ?? "ltx-video-2");
                          const meta = MODEL_META[activeModel] ?? MODEL_META["ltx-video-2"];
                          return (
                            <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${meta.bgClass} ${meta.colorClass}`}>
                              {meta.icon} {meta.shotType} · {meta.price}
                            </span>
                          );
                        })()}
                        <span className="text-xs text-zinc-600">{scene.duration}s</span>
                        {/* Spacer push generate to right */}
                        <div className="flex-1" />
                        {/* Generate button — shown when scene has no clip */}
                        {!clip && !isGenerating && !isQueued && scene.status !== "Generating" && (
                          <Button
                            size="sm"
                            className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700"
                            disabled={loadingPreview === scene.id}
                            onClick={() => generateScene(scene.id, undefined, undefined, `Scene ${scene.sequenceNumber} — ${(scene.description || '').slice(0, 40)}`)}
                          >
                            {loadingPreview === scene.id
                              ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Loading…</>
                              : <><Zap className="h-3 w-3 mr-1" /> Preview & Generate</>
                            }
                          </Button>
                        )}
                      </div>
                      {/* Routing reason from AI */}
                      {scene.routingReason && !budgetMode && (
                        <p className="text-xs text-zinc-600 italic mb-1.5">{scene.routingReason}</p>
                      )}
                      {/* Manual model override */}
                      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                        <span className="text-xs text-zinc-600">Override:</span>
                        <select
                          value={sceneModels[scene.id] ?? scene.modelAssigned}
                          onChange={(e) => setSceneModels((prev) => ({ ...prev, [scene.id]: e.target.value }))}
                          className="text-xs px-1.5 py-0.5 rounded border border-zinc-700/50 bg-zinc-800/50 text-zinc-500 cursor-pointer hover:border-zinc-600 hover:text-zinc-300 transition-colors"
                        >
                          {MODEL_OPTIONS.map((m) => (
                            <option key={m.value} value={m.value}>{m.label} ({m.badge})</option>
                          ))}
                        </select>
                        {(sceneModels[scene.id] ?? scene.modelAssigned) !== "kling-3.0" && (
                          <button
                            className="text-xs text-blue-400 hover:text-blue-200 underline"
                            onClick={() => setSceneModels((prev) => ({ ...prev, [scene.id]: "kling-3.0" }))}
                            title="Kling produces the best quality for complex Ramayana divine scenes"
                          >
                            → Use Kling for best quality
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-zinc-300 mb-2">{scene.description}</p>

                      {/* Characters in this scene */}
                      {scene.characters && scene.characters.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {scene.characters.map((c) => (
                            <span
                              key={c.id}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/20"
                            >
                              {c.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Current prompt (collapsible) */}
                      {(scene.prompt || scene.promptEn) && (() => {
                        const selectedModel = sceneModels[scene.id] ?? scene.modelAssigned;
                        const usesEn = selectedModel === 'ltx-video-2' || selectedModel === 'wan-2.1';
                        const displayPrompt = usesEn ? (scene.promptEn || scene.prompt) : scene.prompt;
                        return (
                          <details className="mb-2">
                            <summary className="text-xs text-zinc-600 cursor-pointer hover:text-zinc-400 select-none">
                              View AI prompt {usesEn && <span className="text-green-600">(English)</span>}
                            </summary>
                            <p className="text-xs text-zinc-500 mt-1 font-mono leading-relaxed bg-zinc-800/40 rounded p-2">
                              {displayPrompt}
                            </p>
                          </details>
                        );
                      })()}

                      {/* Narration text + dialogue + audio */}
                      {(scene.narrationText || (scene.dialogues && scene.dialogues.length > 0)) && (
                        <div className="mb-2 bg-purple-950/20 border border-purple-800/30 rounded-lg p-2.5">
                          {scene.narrationText && (
                            <p className="text-xs text-purple-300 leading-relaxed">{scene.narrationText}</p>
                          )}
                          {scene.dialogues && scene.dialogues.length > 0 && (
                            <div className="mt-1.5 space-y-1">
                              {scene.dialogues.map((dlg, di) => (
                                <p key={di} className="text-xs">
                                  <span className="text-yellow-400 font-medium">{dlg.character}:</span>
                                  <span className="text-zinc-300 ml-1 italic">"{dlg.text}"</span>
                                </p>
                              ))}
                            </div>
                          )}
                          <div className="mt-2">
                          {scene.sceneAudio ? (
                            <div className="flex items-center gap-2">
                              <audio controls preload="none" className="h-7 flex-1" src={scene.sceneAudio} />
                              <button
                                onClick={() => generateSceneVoice(scene.id)}
                                disabled={generatingSceneVoice === scene.id || generatingVoices}
                                className="text-xs text-purple-400 hover:text-purple-200 flex items-center gap-1 shrink-0"
                                title="Re-generate voice"
                              >
                                {generatingSceneVoice === scene.id
                                  ? <Loader2 className="h-3 w-3 animate-spin" />
                                  : <RefreshCw className="h-3 w-3" />}
                              </button>
                            </div>
                          ) : voiceAssets.length === 0 ? (
                            <p className="text-xs text-yellow-500/70">
                              No voice asset — <a href="/voice" className="underline hover:text-yellow-300">set one up</a> to enable audio
                            </p>
                          ) : (
                            <button
                              onClick={() => generateSceneVoice(scene.id)}
                              disabled={generatingSceneVoice === scene.id || generatingVoices}
                              className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-200 disabled:opacity-40"
                            >
                              {generatingSceneVoice === scene.id
                                ? <><Loader2 className="h-3 w-3 animate-spin" /> Generating...</>
                                : <><Volume2 className="h-3 w-3" /> Generate voice</>}
                            </button>
                          )}
                          </div>
                        </div>
                      )}

                      {/* Clip preview */}
                      {clip && !isGenerating && (
                        <div className="space-y-2 mt-2">
                          {videoErrors[clip.id] ? (
                            <div className="w-full max-w-md rounded-lg border border-red-500/30 bg-red-500/10 flex flex-col items-center justify-center gap-2 p-4" style={{ minHeight: "80px" }}>
                              <XCircle className="h-5 w-5 text-red-400" />
                              <p className="text-xs text-red-400 text-center">Clip URL expired</p>
                              <Button
                                size="sm"
                                className="bg-orange-600 hover:bg-orange-700 h-7 text-xs"
                                onClick={() => {
                                  // Clear any stale generating lock so this scene can run immediately
                                  generatingRef.current.delete(scene.id);
                                  setGeneratingScene(null);
                                  setVideoErrors((p) => ({ ...p, [clip.id]: false }));
                                  runScene(scene.id);
                                }}
                              >
                                <RefreshCw className="h-3 w-3 mr-1" /> Regenerate Clip
                              </Button>
                            </div>
                          ) : (
                          <video
                            src={clip.clipUrl}
                            controls
                            preload="none"
                            playsInline
                            className="w-full max-w-md rounded-lg border border-zinc-700"
                            style={{ maxHeight: "200px" }}
                            onError={() => setVideoErrors((p) => ({ ...p, [clip.id]: true }))}
                          />
                          )}
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="flex items-center gap-1 text-xs text-green-400">
                              <CheckCircle className="h-3 w-3" /> Clip ready · {formatCurrency(clip.cost)}
                              {scene.locationTag && (
                                <span className="ml-1 text-zinc-500">· {scene.locationTag}</span>
                              )}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs"
                              disabled={isGenerating || !!generatingScene || loadingPreview === scene.id}
                              onClick={() => generateScene(scene.id, undefined, undefined, `Scene ${scene.sequenceNumber} — ${(scene.description || '').slice(0, 40)}`)}
                            >
                              {loadingPreview === scene.id
                                ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Loading…</>
                                : <>
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    {(() => {
                                      const m = budgetMode ? "kling-3.0" : (sceneModels[scene.id] ?? scene.modelAssigned);
                                      const meta = MODEL_META[m];
                                      return meta ? `${meta.icon} Redo with ${m}` : `Regenerate`;
                                    })()}
                                  </>
                              }
                            </Button>
                            {/* Lock background: saves this clip's first frame as the reference image for its location */}
                            {scene.locationTag && clip.clipUrl.includes("cloudinary.com") && (
                              <button
                                onClick={() => lockBackground(scene, clip.clipUrl)}
                                disabled={lockingBackground === scene.id}
                                className="text-xs text-amber-400 hover:text-amber-200 flex items-center gap-1 disabled:opacity-40"
                                title={`Lock this background as the default for all ${scene.locationTag} scenes`}
                              >
                                {lockingBackground === scene.id
                                  ? <Loader2 className="h-3 w-3 animate-spin" />
                                  : lockedBg[scene.id]
                                    ? <><CheckCircle className="h-3 w-3" /> {scene.locationTag} locked</>
                                    : <>🔒 Lock {scene.locationTag} bg</>}
                              </button>
                            )}
                            <button
                              onClick={() => setFeedbackOpen(isFeedbackOpen ? null : scene.id)}
                              className="text-xs text-zinc-400 hover:text-zinc-200 underline"
                            >
                              Feedback &amp; custom prompt
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
                          <Loader2 className="h-3 w-3 animate-spin" /> Generating on FAL (~60–120s)... page refresh safe
                        </div>
                      )}
                      {isQueued && !isGenerating && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-blue-400">
                          <Clock className="h-3 w-3" /> Queued — waiting for previous scene to finish
                        </div>
                      )}
                      {/* Stuck scene — webhook didn't deliver */}
                      {!clip && !isGenerating && !isQueued && scene.status === "Generating" && (
                        <div className="mt-2 space-y-1.5">
                          <div className="flex items-center gap-2 text-xs text-orange-400">
                            <Clock className="h-3 w-3" />
                            <span>Previous generation incomplete — click Recover Clip to check FAL status</span>
                          </div>
                          {rescueMsg[scene.id] && (
                            <p className={`text-xs ${rescueMsg[scene.id].startsWith("❌") ? "text-red-400" : "text-zinc-400"}`}>
                              {rescueMsg[scene.id]}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                              onClick={() => rescueScene(scene.id)}
                              disabled={rescuingScene === scene.id}
                            >
                              {rescuingScene === scene.id
                                ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Checking...</>
                                : "🔍 Recover Clip"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs text-zinc-500"
                              onClick={() => generateScene(scene.id)}
                              disabled={!!generatingScene || queueRunning}
                              title="Only regenerate if Recover Clip confirms the FAL job failed"
                            >
                              Regenerate anyway
                            </Button>
                          </div>
                        </div>
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

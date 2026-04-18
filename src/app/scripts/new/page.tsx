"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Sparkles, FileText } from "lucide-react";
import { useChannel } from "@/lib/channel-context";
import { cn } from "@/lib/utils";

const universeColors: Record<string, string> = {
  A: "bg-orange-500/20 text-orange-400",
  B: "bg-blue-500/20 text-blue-400",
  C: "bg-green-500/20 text-green-400",
};

export default function NewScriptPage() {
  const router = useRouter();
  const { channels, loading: channelsLoading } = useChannel();

  const [form, setForm] = useState({
    channelId: "",
    title: "",
    hook: "",
    fullScript: "",
    musicMood: "",
    formatVariant: "Standard",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wordCount = form.fullScript.trim() ? form.fullScript.trim().split(/\s+/).length : 0;
  const estDuration = Math.round(wordCount / 2.5); // ~150 words/min

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.channelId || !form.title || !form.fullScript.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/scripts/parse-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create script");
        return;
      }
      router.push(`/scripts/${data.id}`);
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Write Script"
        description="Write your script manually — AI will parse it into scenes for video production"
        actions={
          <Button variant="ghost" onClick={() => router.push("/scripts")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Scripts
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">

          {/* Channel + meta */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-5 space-y-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Script Details</p>

              <div className="space-y-1.5">
                <Label>Channel *</Label>
                {channelsLoading ? (
                  <div className="h-9 rounded-md bg-zinc-800 animate-pulse" />
                ) : (
                  <Select value={form.channelId} onValueChange={(v) => setForm({ ...form, channelId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
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
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Video Title *</Label>
                  <Input
                    required
                    placeholder="e.g. Dal Baati + Eklavya ki Kahani"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Format</Label>
                  <Select value={form.formatVariant} onValueChange={(v) => setForm({ ...form, formatVariant: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Standard">Standard</SelectItem>
                      <SelectItem value="Short">Short (Reels / Shorts)</SelectItem>
                      <SelectItem value="Long-form">Long-form</SelectItem>
                      <SelectItem value="Story + Recipe">Story + Recipe</SelectItem>
                      <SelectItem value="Educational">Educational</SelectItem>
                      <SelectItem value="Motivational">Motivational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Hook <span className="text-zinc-600 text-xs">(optional — opening attention-grabber)</span></Label>
                  <Input
                    placeholder="e.g. Aaj main banaungi dal baati..."
                    value={form.hook}
                    onChange={(e) => setForm({ ...form, hook: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Music Mood <span className="text-zinc-600 text-xs">(optional)</span></Label>
                  <Input
                    placeholder="e.g. Warm Rajasthani folk, soft sitar"
                    value={form.musicMood}
                    onChange={(e) => setForm({ ...form, musicMood: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main script editor */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Full Script / Narration *</p>
                  <p className="text-xs text-zinc-600 mt-0.5">Write your complete narration. AI will break it into video scenes automatically.</p>
                </div>
                {wordCount > 0 && (
                  <div className="text-right text-xs text-zinc-500 shrink-0">
                    <p>{wordCount} words</p>
                    <p className="text-zinc-600">~{estDuration}s video</p>
                  </div>
                )}
              </div>

              {/* Speaker guidance */}
              <div className="bg-zinc-800/60 rounded-lg p-3 text-xs text-zinc-500 space-y-1.5">
                <p className="text-zinc-400 font-medium">No character tagging needed for single-host videos</p>
                <p>Just write your narration as one continuous voice. For multiple speakers, use a name prefix:</p>
                <div className="font-mono text-zinc-600 bg-zinc-900/60 rounded p-2 space-y-0.5 mt-1">
                  <p><span className="text-amber-500/80">HOST:</span> Aaj main banaungi dal baati...</p>
                  <p><span className="text-blue-400/80">EKLAVYA:</span> Dronacharya ji, mujhe seekhna hai...</p>
                  <p><span className="text-amber-500/80">HOST:</span> Usne jungle mein jaake seekhna shuru kiya...</p>
                </div>
                <p>Character names mentioned anywhere in the script are automatically matched to your Character assets for video generation.</p>
              </div>
              <Textarea
                required
                value={form.fullScript}
                onChange={(e) => setForm({ ...form, fullScript: e.target.value })}
                rows={20}
                placeholder={`Write your complete narration here…\n\nExample:\nAaj main banaungi dal baati... aur saath mein sunaungi ek kahani — angootha kaat ke de diya, sirf ek vaada nibhane ke liye.\n\nRajasthan ki dharti pe ek bal tha... Eklavya. Nishaad vansh ka brahmin. Bas ek sapna tha uska — duniya ka sabse bada dhanurdhar banna.\n\nUsne suna tha Dronacharya ke baare mein...`}
                className="font-mono text-sm leading-relaxed resize-y min-h-[400px]"
              />
            </CardContent>
          </Card>

          {/* What happens next info box */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
            <Sparkles className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-blue-300 font-medium mb-1">What happens after you submit</p>
              <ol className="text-blue-200/70 space-y-0.5 text-xs list-decimal ml-4">
                <li>AI reads your script and breaks it into 6–12 video scenes</li>
                <li>Each scene gets a FAL video prompt, camera direction, and model assignment (Kling / Minimax / LTX)</li>
                <li>Script lands in <strong>Draft</strong> status — review it, then click <strong>Approve Script</strong></li>
                <li>After approval, click <strong>Start Production</strong> to generate all scene videos</li>
              </ol>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pb-6">
            <Button type="button" variant="ghost" onClick={() => router.push("/scripts")}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !form.channelId || !form.title || !form.fullScript.trim()}
              className="min-w-[180px]"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Parsing into scenes…</>
              ) : (
                <><FileText className="h-4 w-4 mr-2" /> Create Script</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

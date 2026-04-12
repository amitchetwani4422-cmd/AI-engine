"use client";

import React, { useEffect, useState } from "react";
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
import { ArrowLeft, Loader2, Wand2, FileText, CheckCircle } from "lucide-react";
import Link from "next/link";

interface Channel {
  id: string;
  name: string;
  primaryPlatform: string;
}

const FORMAT_OPTIONS = [
  { value: "Reel", label: "Reel / Short (≤ 60s)", desc: "6–10 scenes, ~5s each" },
  { value: "Short", label: "YouTube Short (≤ 30s)", desc: "4–6 scenes, ~5s each" },
  { value: "Standard", label: "Standard (60–90s)", desc: "10–15 scenes" },
];

const EXAMPLE_SCRIPTS = [
  {
    label: "Ramayana scene (Hindi)",
    text: `राम वनवास की तैयारी करते हैं।

कैकेयी के वरदान के कारण राम को 14 वर्ष का वनवास मिला।
राम ने बिना किसी शिकायत के पिता का आदेश स्वीकार किया।
सीता और लक्ष्मण भी साथ जाने का निर्णय करते हैं।
तीनों अयोध्या से विदा लेते हैं — राजसी वस्त्र उतारकर वल्कल धारण करते हैं।
दशरथ का हृदय टूटता है, प्रजा शोक में डूब जाती है।`,
  },
  {
    label: "Motivational (English)",
    text: `Every great story starts with a single step.

The road to success is never straight.
There will be days when everything feels impossible.
But it's exactly those days that build your character.
The strongest steel is forged in the hottest fire.
Keep moving. Keep pushing. Your moment is coming.`,
  },
];

export default function NewScriptPage() {
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);

  const [title, setTitle] = useState("");
  const [script, setScript] = useState("");
  const [channelId, setChannelId] = useState("");
  const [format, setFormat] = useState("Reel");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null); // script id

  useEffect(() => {
    fetch("/api/channels")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setChannels(list);
        if (list.length > 0) setChannelId(list[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingChannels(false));
  }, []);

  const wordCount = script.trim().split(/\s+/).filter(Boolean).length;
  const charCount = script.length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!script.trim() || !channelId) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/scripts/generate-from-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawScript: script.trim(),
          channelId,
          title: title.trim() || undefined,
          formatVariant: format,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      setDone(data.id);
      // Redirect after a moment so user sees success
      setTimeout(() => router.push(`/scripts/${data.id}`), 800);
    } catch (err) {
      setError(String(err));
    } finally {
      setGenerating(false);
    }
  }

  if (done) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <CheckCircle className="h-10 w-10 text-green-400" />
        <p className="text-zinc-200 font-medium">Scenes generated!</p>
        <p className="text-zinc-500 text-sm">Redirecting to your script…</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Create Reel from Script"
        description="Write or paste your script — AI will break it into visual scenes ready for production"
        actions={
          <Button variant="ghost" asChild>
            <Link href="/scripts">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Scripts
            </Link>
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Channel + Format */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Channel</Label>
                  {loadingChannels ? (
                    <div className="flex items-center gap-2 text-zinc-500 text-sm py-2">
                      <Loader2 className="h-3 w-3 animate-spin" /> Loading…
                    </div>
                  ) : (
                    <Select value={channelId} onValueChange={setChannelId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select channel" />
                      </SelectTrigger>
                      <SelectContent>
                        {channels.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Format</Label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMAT_OPTIONS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-zinc-600">
                    {FORMAT_OPTIONS.find((f) => f.value === format)?.desc}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Title (optional) */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4 space-y-1.5">
                <Label>
                  Title <span className="text-zinc-600 font-normal">(optional — AI will suggest one)</span>
                </Label>
                <Input
                  placeholder="e.g. Ram ka Vanvas — Episode 1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </CardContent>
            </Card>

            {/* Script textarea */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-zinc-400" /> Your Script
                  </Label>
                  <div className="flex items-center gap-3 text-xs text-zinc-600">
                    <span>{wordCount} words</span>
                    <span>{charCount} chars</span>
                  </div>
                </div>
                <Textarea
                  required
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder={`Write or paste your script here…\n\nYou can write in Hindi, English, or both.\nInclude character names before dialogue lines.\n\nExample:\nNarrator: Ram ne apna rajpaat tyaga...\nRam: Pita ki aagya ka paalan karna mera dharm hai.`}
                  rows={14}
                  className="font-mono text-sm resize-y"
                />
                <p className="text-xs text-zinc-600">
                  Tip: Label character dialogue as "Ram: ..." or "Narrator: ..." for accurate voice assignment.
                </p>

                {/* Example scripts */}
                <div className="pt-2 border-t border-zinc-800">
                  <p className="text-xs text-zinc-600 mb-2">Try an example:</p>
                  <div className="flex gap-2 flex-wrap">
                    {EXAMPLE_SCRIPTS.map((ex) => (
                      <button
                        key={ex.label}
                        type="button"
                        onClick={() => setScript(ex.text)}
                        className="text-xs px-2.5 py-1 rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
                      >
                        {ex.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What happens next */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-zinc-400 mb-2">What happens when you submit:</p>
                <ol className="text-xs text-zinc-500 space-y-1 list-decimal list-inside">
                  <li>AI reads your script and defines a consistent visual world</li>
                  <li>Breaks into 6–12 visual scenes with cinematic prompts</li>
                  <li>Extracts narration text and character dialogues per scene</li>
                  <li>Routes each scene to the right video model (Kling / LTX / Wan)</li>
                  <li>Redirects to the script review page — approve and start production</li>
                </ol>
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={generating || !script.trim() || !channelId}
              size="lg"
            >
              {generating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating scenes… (~15–30s)</>
              ) : (
                <><Wand2 className="h-4 w-4 mr-2" /> Generate Scenes from Script</>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

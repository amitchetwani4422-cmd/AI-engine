"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Zap, BookOpen, CheckCircle, Clock, Film } from "lucide-react";

const KANDAS = [
  { value: "Bala",       label: "बाल काण्ड",        beats: 12, desc: "राम जन्म से विवाह तक" },
  { value: "Ayodhya",    label: "अयोध्या काण्ड",     beats: 12, desc: "वनवास और दशरथ की मृत्यु" },
  { value: "Aranya",     label: "अरण्य काण्ड",       beats: 10, desc: "वन जीवन और सीता हरण" },
  { value: "Kishkindha", label: "किष्किन्धा काण्ड",  beats: 9,  desc: "हनुमान मिलन से सेना निर्माण" },
  { value: "Sundara",    label: "सुन्दर काण्ड",       beats: 7,  desc: "हनुमान की लंका यात्रा" },
  { value: "Yuddha",     label: "युद्ध काण्ड",        beats: 12, desc: "महायुद्ध और रावण वध" },
  { value: "Uttara",     label: "उत्तर काण्ड",        beats: 6,  desc: "रामराज्य और सीता की वापसी" },
];

interface Channel { id: string; name: string; }
interface Episode { id: string; episodeNumber: number; title: string; status: string; storyBeatId?: string; }
interface GeneratedSeries { id: string; name: string; kanda: string; episodes: Episode[]; channel: { name: string }; }

export default function ArcsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelId, setChannelId] = useState("");
  const [kanda, setKanda] = useState("");
  const [episodeCount, setEpisodeCount] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedSeries | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/channels").then((r) => r.json()).then((d) => {
      const list = Array.isArray(d) ? d : [];
      setChannels(list);
      if (list.length > 0) setChannelId(list[0].id);
    });
  }, []);

  const selectedKanda = KANDAS.find((k) => k.value === kanda);

  async function generate() {
    if (!channelId || !kanda) return;
    setGenerating(true);
    setError("");
    setResult(null);
    try {
      const body: Record<string, unknown> = { channelId, kanda };
      if (episodeCount && parseInt(episodeCount) > 0) body.episodeCount = parseInt(episodeCount);

      const res = await fetch("/api/arcs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Generation failed"); return; }
      setResult(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Arc Generator"
        description="रामायण काण्ड चुनें — सभी Episodes एक क्लिक में बनाएं"
      />
      <div className="flex-1 overflow-auto p-6 max-w-3xl mx-auto w-full">

        {/* Config Card */}
        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardContent className="p-6 space-y-5">
            <div className="space-y-1.5">
              <Label>Channel</Label>
              <Select value={channelId} onValueChange={setChannelId}>
                <SelectTrigger><SelectValue placeholder="Channel चुनें" /></SelectTrigger>
                <SelectContent>
                  {channels.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>काण्ड (Kanda)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {KANDAS.map((k) => (
                  <button
                    key={k.value}
                    onClick={() => setKanda(k.value)}
                    className={`text-left p-3 rounded-lg border transition-all ${
                      kanda === k.value
                        ? "border-orange-500 bg-orange-500/10 text-orange-300"
                        : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600"
                    }`}
                  >
                    <p className="text-sm font-medium">{k.label}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{k.beats} प्रसंग</p>
                  </button>
                ))}
              </div>
              {selectedKanda && (
                <p className="text-xs text-zinc-500 mt-1">{selectedKanda.desc}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Episodes की संख्या <span className="text-zinc-600">(खाली = सभी)</span></Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={episodeCount}
                onChange={(e) => setEpisodeCount(e.target.value)}
                placeholder={selectedKanda ? `सभी ${selectedKanda.beats} episodes` : "e.g. 5"}
                className="w-40"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <Button
              onClick={generate}
              disabled={generating || !channelId || !kanda}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              size="lg"
            >
              {generating
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Episodes बन रहे हैं...</>
                : <><Zap className="h-4 w-4 mr-2" /> Arc Generate करें</>}
            </Button>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div>
                  <p className="font-medium text-zinc-100">{result.name}</p>
                  <p className="text-xs text-zinc-500">{result.channel.name} · {result.episodes.length} episodes created</p>
                </div>
                <Badge className="ml-auto bg-green-500/20 text-green-400">Created</Badge>
              </div>

              <div className="space-y-1.5">
                {result.episodes.map((ep) => (
                  <div key={ep.id} className="flex items-center gap-3 bg-zinc-800/40 rounded-lg px-3 py-2">
                    <Film className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                    <span className="text-xs font-mono text-zinc-600 w-6">E{ep.episodeNumber}</span>
                    <p className="text-sm text-zinc-300 flex-1">{ep.title}</p>
                    <Clock className="h-3 w-3 text-zinc-600" />
                    <span className="text-xs text-zinc-600">Planned</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => window.location.href = "/series"}>
                  <BookOpen className="h-3.5 w-3.5 mr-1.5" /> Series में देखें
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setResult(null); setKanda(""); }}>
                  नया Arc बनाएं
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

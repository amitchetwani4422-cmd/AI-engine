"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, Plus, Loader2, Play, Music, AlertCircle } from "lucide-react";

interface VoiceAsset {
  id: string; name: string; elevenlabsVoiceId?: string; channelId?: string;
  referenceAudios: string[]; tonePresets: string[]; language: string;
  isMultilingual: boolean;
}

export default function VoicePage() {
  const [voices, setVoices] = useState<VoiceAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({ name: "", elevenlabsVoiceId: "", language: "Hindi", tonePresets: "calm,dramatic", isMultilingual: false });
  const [genForm, setGenForm] = useState({ text: "", voiceAssetId: "", emotion: "neutral" });
  const [genResult, setGenResult] = useState<{ audioUrl?: string; error?: string } | null>(null);

  useEffect(() => {
    fetch("/api/voice").then((r) => r.json()).then((d) => setVoices(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  }, []);

  async function createVoice(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, tonePresets: form.tonePresets.split(",").map((t) => t.trim()), referenceAudios: [] }),
    });
    setShowCreate(false);
    fetch("/api/voice").then((r) => r.json()).then((d) => setVoices(Array.isArray(d) ? d : []));
  }

  async function generateVoice(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setGenResult(null);
    try {
      const res = await fetch("/api/voice/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(genForm),
      });
      const data = await res.json();
      setGenResult(res.ok ? { audioUrl: data.audioUrl } : { error: data.error });
    } finally { setGenerating(false); }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Voice & Audio"
        subtitle="Character voices, narration, and music management"
        actions={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> Add Voice</Button>}
      />
      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="voices">
          <TabsList className="bg-zinc-900 border border-zinc-800 mb-6">
            <TabsTrigger value="voices">Voice Assets</TabsTrigger>
            <TabsTrigger value="generate">Generate Voice</TabsTrigger>
            <TabsTrigger value="bhajan">Bhajan Workflow</TabsTrigger>
          </TabsList>

          <TabsContent value="voices">
            {loading ? (
              <div className="flex items-center justify-center h-32"><Loader2 className="h-5 w-5 animate-spin text-zinc-500" /></div>
            ) : voices.length === 0 ? (
              <div className="text-center py-12">
                <Mic className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400 mb-2">No voice assets yet</p>
                <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> Add Voice Asset</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {voices.map((voice) => (
                  <Card key={voice.id} className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                          <Mic className="h-4 w-4 text-zinc-400" />
                        </div>
                        <div>
                          <p className="font-medium text-zinc-200">{voice.name}</p>
                          <p className="text-xs text-zinc-500">{voice.language} {voice.isMultilingual && "· Multilingual"}</p>
                        </div>
                      </div>
                      {voice.elevenlabsVoiceId && (
                        <p className="text-xs text-zinc-600 font-mono mb-2">{voice.elevenlabsVoiceId}</p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {voice.tonePresets.map((tone) => (
                          <Badge key={tone} className="bg-zinc-800 text-zinc-400 text-xs">{tone}</Badge>
                        ))}
                      </div>
                      {voice.referenceAudios.length > 0 && (
                        <p className="text-xs text-zinc-600 mt-2">{voice.referenceAudios.length} reference audio(s)</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="generate">
            <div className="max-w-lg">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader><CardTitle className="text-sm">Generate Voice</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={generateVoice} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Voice Asset</Label>
                      <Select value={genForm.voiceAssetId} onValueChange={(v) => setGenForm({ ...genForm, voiceAssetId: v })}>
                        <SelectTrigger><SelectValue placeholder="Select voice" /></SelectTrigger>
                        <SelectContent>
                          {voices.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Emotion / Style</Label>
                      <Select value={genForm.emotion} onValueChange={(v) => setGenForm({ ...genForm, emotion: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["neutral", "calm", "dramatic", "devotional", "playful", "energetic"].map((e) => (
                            <SelectItem key={e} value={e}>{e}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Text *</Label>
                      <Textarea required rows={4} value={genForm.text} onChange={(e) => setGenForm({ ...genForm, text: e.target.value })} placeholder="Enter the narration or dialogue text..." />
                    </div>
                    <Button type="submit" disabled={generating || !genForm.voiceAssetId || !genForm.text} className="w-full">
                      {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mic className="h-4 w-4 mr-2" />}
                      Generate Voice
                    </Button>
                    {genResult?.audioUrl && (
                      <div className="mt-3 p-3 bg-green-950/30 border border-green-800/50 rounded-lg">
                        <p className="text-xs text-green-400 mb-2">Voice generated successfully</p>
                        <audio controls className="w-full" src={genResult.audioUrl} />
                      </div>
                    )}
                    {genResult?.error && (
                      <div className="mt-3 p-3 bg-red-950/30 border border-red-800/50 rounded-lg flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <p className="text-xs text-red-400">{genResult.error}</p>
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bhajan">
            <Card className="bg-zinc-900 border-zinc-800 max-w-2xl">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Music className="h-4 w-4" /> Bhajan / Devotional Workflow</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm text-zinc-300">
                <p>For bhajan and devotional content, audio must be generated or uploaded <strong className="text-zinc-100">first</strong>, then passed as a reference to Veo 3.1 for lip-sync.</p>
                <div className="space-y-3">
                  {[
                    { step: 1, title: "Generate or Upload Audio", desc: "Use the Generate Voice tab or upload your bhajan audio file directly" },
                    { step: 2, title: "Save to Assets", desc: "Store the audio URL in the Asset Library tagged as 'voice' for this video" },
                    { step: 3, title: "Link to Veo 3.1 Scene", desc: "When generating the scene in Production, paste the audio URL as the audioUrl reference — Veo 3.1 will sync character lips to the audio" },
                    { step: 4, title: "Verify Lip Sync", desc: "In Quality Check, score the 'Lip Sync Accuracy' dimension to confirm sync quality" },
                  ].map(({ step, title, desc }) => (
                    <div key={step} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold flex-shrink-0">{step}</div>
                      <div>
                        <p className="font-medium text-zinc-200">{title}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader><DialogTitle>Add Voice Asset</DialogTitle></DialogHeader>
          <form onSubmit={createVoice} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ram Narrator Voice" />
            </div>
            <div className="space-y-1.5">
              <Label>ElevenLabs Voice ID</Label>
              <Input value={form.elevenlabsVoiceId} onChange={(e) => setForm({ ...form, elevenlabsVoiceId: e.target.value })} placeholder="From ElevenLabs dashboard" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Language</Label>
                <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Hindi", "English", "Sanskrit", "Bengali", "Tamil"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tone Presets (comma-sep)</Label>
                <Input value={form.tonePresets} onChange={(e) => setForm({ ...form, tonePresets: e.target.value })} placeholder="calm, dramatic, devotional" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit">Save Voice</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Palette, Save, Edit3 } from "lucide-react";

interface StyleBible {
  id?: string; channelId: string; visualIdentity?: string; lightingPreferences?: string;
  cameraFeel?: string; subtitleStyle?: string; musicDirection?: string; narrationTone?: string;
  worldRules?: string; visualConstraints?: string; compositionStyles: string[];
  thumbnailRules?: Record<string, string>; preferredModelPerType?: Record<string, string>;
}
interface Channel { id: string; name: string; }

export default function StyleBiblePage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState("");
  const [bible, setBible] = useState<StyleBible | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<StyleBible>>({});

  useEffect(() => {
    fetch("/api/channels").then((r) => r.json()).then((d) => {
      const chs = Array.isArray(d) ? d : [];
      setChannels(chs);
      if (chs.length > 0) setSelectedChannel(chs[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedChannel) fetchBible();
  }, [selectedChannel]);

  async function fetchBible() {
    setLoading(true);
    try {
      const data = await fetch(`/api/style-bible/${selectedChannel}`).then((r) => r.json());
      setBible(data);
      setForm(data ?? {});
    } finally { setLoading(false); }
  }

  async function saveBible() {
    setSaving(true);
    try {
      await fetch(`/api/style-bible/${selectedChannel}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, channelId: selectedChannel }),
      });
      await fetchBible();
      setEditing(false);
    } finally { setSaving(false); }
  }

  const sections: Array<{ key: keyof StyleBible; label: string; multiline?: boolean }> = [
    { key: "visualIdentity", label: "Visual Identity", multiline: true },
    { key: "lightingPreferences", label: "Lighting Preferences" },
    { key: "cameraFeel", label: "Camera Feel & Pacing" },
    { key: "subtitleStyle", label: "Subtitle Style" },
    { key: "musicDirection", label: "Music Direction" },
    { key: "narrationTone", label: "Narration Tone" },
    { key: "worldRules", label: "World Rules", multiline: true },
    { key: "visualConstraints", label: "Visual Constraints", multiline: true },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Style Bible"
        description="Channel identity and visual continuity"
        actions={
          editing ? (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => { setEditing(false); setForm(bible ?? {}); }}>Cancel</Button>
              <Button onClick={saveBible} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setEditing(true)} disabled={!bible}>
              <Edit3 className="h-4 w-4 mr-2" /> Edit Style Bible
            </Button>
          )
        }
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-5">
          <Select value={selectedChannel} onValueChange={setSelectedChannel}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Select channel" /></SelectTrigger>
            <SelectContent>
              {channels.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>
        ) : !selectedChannel ? (
          <div className="text-center py-12">
            <Palette className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">Select a channel to view its Style Bible</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sections.map(({ key, label, multiline }) => (
              <Card key={key as string} className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2"><CardTitle className="text-sm">{label}</CardTitle></CardHeader>
                <CardContent>
                  {editing ? (
                    multiline ? (
                      <Textarea
                        value={(form[key] as string) ?? ""}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        placeholder={`Define ${label.toLowerCase()}...`}
                        rows={3}
                      />
                    ) : (
                      <Input
                        value={(form[key] as string) ?? ""}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        placeholder={`Define ${label.toLowerCase()}...`}
                      />
                    )
                  ) : (
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                      {(bible?.[key] as string) || <span className="text-zinc-600 italic">Not defined</span>}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}

            <Card className="bg-zinc-900 border-zinc-800 md:col-span-2">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Preferred Model Per Content Type</CardTitle></CardHeader>
              <CardContent>
                {bible?.preferredModelPerType ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(bible.preferredModelPerType).map(([type, model]) => (
                      <div key={type} className="flex items-center justify-between bg-zinc-800/50 rounded px-3 py-2 text-xs">
                        <span className="text-zinc-400 capitalize">{type}</span>
                        <span className={model === "kling-3.0" ? "text-blue-400" : "text-purple-400"}>{model}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-600 italic">Not configured</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

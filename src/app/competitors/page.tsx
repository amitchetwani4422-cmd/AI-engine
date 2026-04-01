"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Eye, Plus, Loader2, ExternalLink, Search } from "lucide-react";

interface Ref {
  id: string; url: string; platform: string; formatType?: string;
  hookStructure?: string; whatWorked?: string; tags: string[]; notes?: string; channelId: string;
  createdAt: string;
}
interface Channel { id: string; name: string; }

export default function CompetitorsPage() {
  const [refs, setRefs] = useState<Ref[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ url: "", platform: "youtube", formatType: "", hookStructure: "", whatWorked: "", tags: "", notes: "", channelId: "" });

  useEffect(() => {
    fetch("/api/channels").then((r) => r.json()).then((d) => setChannels(Array.isArray(d) ? d : []));
    fetchRefs();
  }, []);

  useEffect(() => { fetchRefs(); }, [channelFilter]);

  async function fetchRefs() {
    setLoading(true);
    try {
      const params = channelFilter !== "all" ? `?channelId=${channelFilter}` : "";
      const d = await fetch(`/api/competitor-references${params}`).then((r) => r.json());
      setRefs(Array.isArray(d) ? d : []);
    } finally { setLoading(false); }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/competitor-references", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean), channelId: form.channelId || channels[0]?.id }),
    });
    setShowCreate(false);
    setForm({ url: "", platform: "youtube", formatType: "", hookStructure: "", whatWorked: "", tags: "", notes: "", channelId: "" });
    fetchRefs();
  }

  const filtered = refs.filter((r) =>
    !search || r.url.toLowerCase().includes(search.toLowerCase()) ||
    r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
    r.whatWorked?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Competitor References"
        description="Inspiration library — for learning, not copying"
        actions={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> Add Reference</Button>}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input className="pl-9" placeholder="Search references..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              {channels.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Eye className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 mb-2">No competitor references</p>
            <p className="text-zinc-600 text-sm mb-6">Bookmark inspiring videos to analyze what's working in your niche</p>
            <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> Add First Reference</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((ref) => (
              <Card key={ref.id} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge className="bg-zinc-800 text-zinc-400 text-xs flex-shrink-0">{ref.platform}</Badge>
                      <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-xs truncate flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {ref.url} <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    </div>
                  </div>
                  {ref.formatType && (
                    <p className="text-xs text-zinc-500 mb-1">Format: <span className="text-zinc-400">{ref.formatType}</span></p>
                  )}
                  {ref.hookStructure && (
                    <p className="text-xs text-zinc-500 mb-1">Hook: <span className="text-zinc-400">{ref.hookStructure}</span></p>
                  )}
                  {ref.whatWorked && (
                    <div className="bg-green-950/30 border border-green-800/30 rounded px-2 py-1.5 mb-2">
                      <p className="text-xs text-green-400">✓ {ref.whatWorked}</p>
                    </div>
                  )}
                  {ref.notes && <p className="text-xs text-zinc-500 mb-2">{ref.notes}</p>}
                  <div className="flex flex-wrap gap-1">
                    {ref.tags.map((tag) => <Badge key={tag} className="bg-zinc-800 text-zinc-500 text-xs">{tag}</Badge>)}
                  </div>
                  <p className="text-xs text-zinc-700 mt-2">{new Date(ref.createdAt).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
          <DialogHeader><DialogTitle>Add Competitor Reference</DialogTitle></DialogHeader>
          <form onSubmit={create} className="space-y-3">
            <div className="space-y-1.5">
              <Label>URL *</Label>
              <Input required value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Platform</Label>
                <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Channel</Label>
                <Select value={form.channelId} onValueChange={(v) => setForm({ ...form, channelId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{channels.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Format Type</Label>
                <Input value={form.formatType} onChange={(e) => setForm({ ...form, formatType: e.target.value })} placeholder="Long-form, Shorts..." />
              </div>
              <div className="space-y-1.5">
                <Label>Hook Structure</Label>
                <Input value={form.hookStructure} onChange={(e) => setForm({ ...form, hookStructure: e.target.value })} placeholder="Question / Story / Shocking..." />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>What Worked</Label>
              <Input value={form.whatWorked} onChange={(e) => setForm({ ...form, whatWorked: e.target.value })} placeholder="Strong visuals, emotional hook..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tags</Label>
                <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="mythology, vfx, shorts" />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any other notes" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit">Save Reference</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

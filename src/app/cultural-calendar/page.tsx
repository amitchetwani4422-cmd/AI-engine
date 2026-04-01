"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Globe, Plus, Loader2, Calendar, Lightbulb } from "lucide-react";
import { format, parseISO, isAfter, isBefore, addDays } from "date-fns";

interface CulturalEvent {
  id: string; name: string; date: string; type: string; universes: string[];
  channels: string[]; description?: string;
}

const typeColors: Record<string, string> = {
  festival: "bg-yellow-500/20 text-yellow-400",
  "mythology-event": "bg-purple-500/20 text-purple-400",
  devotional: "bg-blue-500/20 text-blue-400",
};

export default function CulturalCalendarPage() {
  const router = useRouter();
  const [events, setEvents] = useState<CulturalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", date: "", type: "festival", universes: "", description: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/cultural-calendar?limit=100")
      .then((r) => r.json())
      .then((d) => setEvents(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await fetch("/api/cultural-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, universes: form.universes.split(",").map((u) => u.trim()).filter(Boolean) }),
      });
      setShowCreate(false);
      setForm({ name: "", date: "", type: "festival", universes: "", description: "" });
      const d = await fetch("/api/cultural-calendar?limit=100").then((r) => r.json());
      setEvents(Array.isArray(d) ? d : []);
    } finally { setCreating(false); }
  }

  // Group by month
  const grouped = events.reduce((acc, event) => {
    const month = format(parseISO(event.date), "MMMM yyyy");
    if (!acc[month]) acc[month] = [];
    acc[month].push(event);
    return acc;
  }, {} as Record<string, CulturalEvent[]>);

  const now = new Date();
  const soon = addDays(now, 30);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Cultural Calendar"
        description="Festival and mythology event schedule"
        actions={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> Add Event</Button>}
      />
      <div className="flex-1 overflow-auto p-6">
        {/* Upcoming alert */}
        {events.filter((e) => {
          const d = parseISO(e.date);
          return isAfter(d, now) && isBefore(d, soon);
        }).length > 0 && (
          <div className="mb-5 bg-yellow-950/30 border border-yellow-800/50 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-300 mb-2">Upcoming in the next 30 days:</p>
            <div className="flex flex-wrap gap-2">
              {events.filter((e) => {
                const d = parseISO(e.date);
                return isAfter(d, now) && isBefore(d, soon);
              }).map((e) => (
                <div key={e.id} className="flex items-center gap-2 bg-yellow-900/30 rounded px-3 py-1.5">
                  <span className="text-xs text-yellow-300 font-medium">{e.name}</span>
                  <span className="text-xs text-yellow-600">{format(parseISO(e.date), "d MMM")}</span>
                  <Button size="sm" variant="ghost" className="h-5 px-1 text-xs text-yellow-400" onClick={() => router.push(`/research`)}>
                    <Lightbulb className="h-3 w-3 mr-0.5" /> Ideas
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([month, monthEvents]) => (
              <div key={month}>
                <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> {month}
                </h3>
                <div className="space-y-2">
                  {monthEvents.map((event) => {
                    const isPast = isBefore(parseISO(event.date), now);
                    return (
                      <div key={event.id} className={`flex items-center gap-4 border rounded-lg px-4 py-3 transition-colors ${isPast ? "bg-zinc-900/50 border-zinc-800/50 opacity-60" : "bg-zinc-900 border-zinc-800"}`}>
                        <div className="text-center w-12 flex-shrink-0">
                          <p className="text-lg font-bold text-zinc-200">{format(parseISO(event.date), "d")}</p>
                          <p className="text-xs text-zinc-500">{format(parseISO(event.date), "MMM")}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <p className="font-medium text-zinc-200">{event.name}</p>
                            <Badge className={`text-xs ${typeColors[event.type] ?? "bg-zinc-800 text-zinc-400"}`}>{event.type}</Badge>
                            {event.universes.map((u) => (
                              <Badge key={u} className={`text-xs ${u === "A" ? "bg-purple-500/20 text-purple-400" : u === "B" ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"}`}>
                                Universe {u}
                              </Badge>
                            ))}
                          </div>
                          {event.description && <p className="text-xs text-zinc-500">{event.description}</p>}
                        </div>
                        {!isPast && (
                          <Button size="sm" variant="ghost" className="flex-shrink-0" onClick={() => router.push("/research")}>
                            <Lightbulb className="h-3 w-3 mr-1" /> Ideas
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader><DialogTitle>Add Cultural Event</DialogTitle></DialogHeader>
          <form onSubmit={createEvent} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>Event Name *</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Diwali 2026" />
              </div>
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="festival">Festival</SelectItem>
                    <SelectItem value="mythology-event">Mythology Event</SelectItem>
                    <SelectItem value="devotional">Devotional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Universes (comma-sep: A, B, C)</Label>
                <Input value={form.universes} onChange={(e) => setForm({ ...form, universes: e.target.value })} placeholder="A, B" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Description</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={creating}>{creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Add Event</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

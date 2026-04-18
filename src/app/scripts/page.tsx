"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Loader2, Wand2, Search } from "lucide-react";

interface Script {
  id: string;
  title: string;
  hook: string;
  formatVariant: string;
  musicMood: string;
  status: string;
  channelId: string;
  channel?: { name: string };
  createdAt: string;
  _count?: { sceneBreakdown: number };
  klingScenes?: number;
  veoScenes?: number;
  estimatedCost?: number;
}

const statusColors: Record<string, string> = {
  Draft: "bg-zinc-700 text-zinc-300",
  Approved: "bg-blue-500/20 text-blue-400",
  "In Production": "bg-yellow-500/20 text-yellow-400",
  Rejected: "bg-red-500/20 text-red-400",
};

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");

  useEffect(() => {
    fetchScripts();
  }, [statusFilter, formatFilter]);

  async function fetchScripts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (formatFilter !== "all") params.set("formatVariant", formatFilter);
      const res = await fetch(`/api/scripts?${params}`);
      const data = await res.json();
      setScripts(Array.isArray(data) ? data : []);
    } catch {
      setScripts([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = scripts.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.hook.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Scripts"
        description="Script and Creative Pack Generator"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/research">
                <Wand2 className="h-4 w-4 mr-2" /> Generate from Idea
              </Link>
            </Button>
            <Button asChild>
              <Link href="/scripts/new">
                <Plus className="h-4 w-4 mr-2" /> New Script
              </Link>
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              className="pl-9"
              placeholder="Search scripts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="In Production">In Production</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={formatFilter} onValueChange={setFormatFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Formats</SelectItem>
              <SelectItem value="long-form">Long-form</SelectItem>
              <SelectItem value="shorts">Shorts</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 mb-2">No scripts found</p>
            <p className="text-zinc-600 text-sm mb-6">Write a script manually or generate one from an idea</p>
            <div className="flex gap-3 justify-center">
              <Button asChild>
                <Link href="/scripts/new"><Plus className="h-4 w-4 mr-2" /> Write Script</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/research"><Wand2 className="h-4 w-4 mr-2" /> Generate from Idea</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((script) => (
              <Link key={script.id} href={`/scripts/${script.id}`}>
                <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-zinc-100 truncate">{script.title}</p>
                          <Badge className={statusColors[script.status] ?? "bg-zinc-700 text-zinc-300"}>
                            {script.status}
                          </Badge>
                          <Badge className="bg-zinc-800 text-zinc-400">
                            {script.formatVariant}
                          </Badge>
                        </div>
                        <p className="text-sm text-zinc-400 truncate">Hook: {script.hook}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                          {script.channel && <span>{script.channel.name}</span>}
                          {script._count && <span>{script._count.sceneBreakdown} scenes</span>}
                          <span>Music: {script.musicMood}</span>
                          {script.estimatedCost && (
                            <span className="text-green-400">${script.estimatedCost.toFixed(2)} est.</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 text-xs text-zinc-500 flex-shrink-0">
                        {script.klingScenes !== undefined && (
                          <span className="text-blue-400">{script.klingScenes} Kling</span>
                        )}
                        {script.veoScenes !== undefined && (
                          <span className="text-purple-400">{script.veoScenes} Veo</span>
                        )}
                        <span>{new Date(script.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

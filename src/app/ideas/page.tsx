"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Lightbulb, Loader2, Sparkles, CheckCircle, FileText,
  Trash2, RefreshCw, ChevronDown, ChevronUp, Zap,
} from "lucide-react";

interface Channel {
  id: string;
  name: string;
  niche: string;
  primaryPlatform: string;
  language: string;
  targetAudience: string;
  contentPillars: string[];
}

interface Idea {
  id: string;
  channelId: string;
  title: string;
  description: string;
  type: string;
  format: string;
  channelFitScore: number;
  noveltyScore: number;
  repeatabilityScore: number;
  monetizationScore: number;
  overallScore: number;
  productionDifficulty: number;
  estimatedCost: number;
  status: string;
  tags: string[];
  notes?: string;
  createdAt: string;
  channel?: { id: string; name: string; primaryPlatform: string };
}

const TYPE_COLOURS: Record<string, string> = {
  topic:     "bg-blue-500/20 text-blue-400",
  series:    "bg-purple-500/20 text-purple-400",
  hook:      "bg-orange-500/20 text-orange-400",
  trend:     "bg-red-500/20 text-red-400",
  evergreen: "bg-green-500/20 text-green-400",
};

const STATUS_COLOURS: Record<string, string> = {
  Draft:    "bg-zinc-700 text-zinc-400",
  Approved: "bg-green-500/20 text-green-400",
  Rejected: "bg-red-500/20 text-red-400",
  Scripted: "bg-blue-500/20 text-blue-400",
};

function ScoreBar({ label, value, colour }: { label: string; value: number; colour: string }) {
  const pct = Math.round((value / 5) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-zinc-500 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colour}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-zinc-500 w-6 text-right">{value.toFixed(1)}</span>
    </div>
  );
}

export default function IdeasPage() {
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingScript, setGeneratingScript] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [generateCount, setGenerateCount] = useState(10);
  const [generateType, setGenerateType] = useState("");
  const [customFocus, setCustomFocus] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/channels").then((r) => r.json()),
      fetch("/api/ideas").then((r) => r.json()),
    ]).then(([ch, id]) => {
      setChannels(Array.isArray(ch) ? ch : []);
      setIdeas(Array.isArray(id) ? id : []);
    }).finally(() => setLoading(false));
  }, []);

  async function fetchIdeas() {
    const params = new URLSearchParams();
    if (selectedChannel !== "all") params.set("channelId", selectedChannel);
    if (statusFilter !== "all") params.set("status", statusFilter);
    const data = await fetch(`/api/ideas?${params}`).then((r) => r.json());
    setIdeas(Array.isArray(data) ? data : []);
  }

  async function generateIdeas() {
    if (selectedChannel === "all") { setError("Select a channel first"); return; }
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ideas/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: selectedChannel,
          count: generateCount,
          type: generateType || undefined,
          customFocus: customFocus.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Generation failed"); return; }
      await fetchIdeas();
    } finally {
      setGenerating(false);
    }
  }

  async function approveIdea(idea: Idea) {
    setApproving(idea.id);
    try {
      const res = await fetch(`/api/ideas/${idea.id}/approve`, { method: "POST" });
      if (res.ok) {
        setIdeas((prev) => prev.map((i) => i.id === idea.id ? { ...i, status: "Approved" } : i));
      }
    } finally {
      setApproving(null);
    }
  }

  async function deleteIdea(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/ideas/${id}`, { method: "DELETE" });
      setIdeas((prev) => prev.filter((i) => i.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  async function generateScript(idea: Idea) {
    setGeneratingScript(idea.id);
    setError(null);
    try {
      const res = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId: idea.id, channelId: idea.channelId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Script generation failed"); return; }
      if (data.id) router.push(`/scripts/${data.id}`);
    } finally {
      setGeneratingScript(null);
    }
  }

  const filtered = ideas.filter((i) => {
    if (selectedChannel !== "all" && i.channelId !== selectedChannel) return false;
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    return true;
  }).sort((a, b) => b.overallScore - a.overallScore);

  const channel = channels.find((c) => c.id === selectedChannel);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Content Ideas"
        description="AI-generated video ideas ranked by channel fit, novelty, and monetisation potential"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Channel selector */}
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
            >
              <option value="all">All channels</option>
              {channels.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Count + type + focus pickers */}
            {selectedChannel !== "all" && (
              <>
                <select
                  value={generateCount}
                  onChange={(e) => setGenerateCount(Number(e.target.value))}
                  className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1.5 text-sm text-zinc-200 focus:outline-none"
                >
                  {[5, 10, 15, 20].map((n) => <option key={n} value={n}>{n} ideas</option>)}
                </select>
                <select
                  value={generateType}
                  onChange={(e) => setGenerateType(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1.5 text-sm text-zinc-200 focus:outline-none"
                >
                  <option value="">Any type</option>
                  <option value="topic">Topic</option>
                  <option value="series">Series</option>
                  <option value="hook">Hook / Trend</option>
                  <option value="evergreen">Evergreen</option>
                </select>
                <input
                  type="text"
                  placeholder="Focus: e.g. Indian street food, ASMR cooking…"
                  value={customFocus}
                  onChange={(e) => setCustomFocus(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && generateIdeas()}
                  className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 w-64"
                />
              </>
            )}

            <Button
              size="sm"
              onClick={generateIdeas}
              disabled={generating || selectedChannel === "all"}
            >
              {generating
                ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Generating…</>
                : <><Sparkles className="h-3.5 w-3.5 mr-1.5" /> Generate Ideas</>}
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        {error && (
          <div className="mb-4 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Channel context banner */}
        {channel && (
          <div className="mb-5 px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 flex flex-wrap gap-4 text-xs text-zinc-400">
            <span><span className="text-zinc-600">Niche </span>{channel.niche}</span>
            <span><span className="text-zinc-600">Platform </span>{channel.primaryPlatform}</span>
            <span><span className="text-zinc-600">Audience </span>{channel.targetAudience}</span>
            <span><span className="text-zinc-600">Language </span>{channel.language}</span>
            {channel.contentPillars.length > 0 && (
              <span><span className="text-zinc-600">Pillars </span>{channel.contentPillars.join(", ")}</span>
            )}
            {customFocus.trim() && (
              <span className="text-amber-400"><span className="text-zinc-600">Focus </span>{customFocus.trim()}</span>
            )}
          </div>
        )}

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 mb-5">
          {["all", "Draft", "Approved", "Scripted", "Rejected"].map((s) => {
            const count = s === "all"
              ? filtered.length
              : ideas.filter((i) => i.status === s && (selectedChannel === "all" || i.channelId === selectedChannel)).length;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-md text-xs transition-colors ${statusFilter === s ? "bg-zinc-700 text-zinc-200" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                {s === "all" ? "All" : s} <span className="ml-1 opacity-60">{count}</span>
              </button>
            );
          })}
          <div className="ml-auto">
            <Button size="sm" variant="ghost" onClick={fetchIdeas} className="h-7 px-2 text-xs text-zinc-500">
              <RefreshCw className="h-3 w-3 mr-1" /> Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Lightbulb className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 mb-1">No ideas yet</p>
            <p className="text-zinc-600 text-sm">
              {selectedChannel === "all"
                ? "Select a channel and click Generate Ideas"
                : "Click Generate Ideas to let AI brainstorm content for this channel"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((idea) => {
              const expanded = expandedId === idea.id;
              const isScripting = generatingScript === idea.id;
              return (
                <Card key={idea.id} className={`bg-zinc-900 border transition-all ${idea.status === "Approved" ? "border-green-700/40" : "border-zinc-800"}`}>
                  <CardContent className="p-4 space-y-3">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <Badge className={`text-[10px] px-1.5 py-0 ${TYPE_COLOURS[idea.type] ?? "bg-zinc-700 text-zinc-400"}`}>
                            {idea.type}
                          </Badge>
                          <Badge className={`text-[10px] px-1.5 py-0 ${STATUS_COLOURS[idea.status] ?? "bg-zinc-700 text-zinc-400"}`}>
                            {idea.status}
                          </Badge>
                          {idea.channel && (
                            <span className="text-[10px] text-zinc-600 truncate">{idea.channel.name}</span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-zinc-100 leading-snug">{idea.title}</p>
                      </div>
                      {/* Overall score pill */}
                      <div className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold border-2 ${
                        idea.overallScore >= 4 ? "border-green-500/50 text-green-400 bg-green-500/10" :
                        idea.overallScore >= 3 ? "border-amber-500/50 text-amber-400 bg-amber-500/10" :
                        "border-zinc-600 text-zinc-400 bg-zinc-800"
                      }`}>
                        {idea.overallScore.toFixed(1)}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-zinc-400 leading-relaxed">{idea.description}</p>

                    {/* Tags */}
                    {idea.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {idea.tags.map((t) => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">{t}</span>
                        ))}
                      </div>
                    )}

                    {/* Expandable scores */}
                    <button
                      onClick={() => setExpandedId(expanded ? null : idea.id)}
                      className="flex items-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
                    >
                      {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      {expanded ? "Hide scores" : "View scores"}
                    </button>
                    {expanded && (
                      <div className="space-y-1.5 pt-1">
                        <ScoreBar label="Channel fit"      value={idea.channelFitScore}       colour="bg-blue-500" />
                        <ScoreBar label="Novelty"          value={idea.noveltyScore}           colour="bg-purple-500" />
                        <ScoreBar label="Repeatability"    value={idea.repeatabilityScore}     colour="bg-teal-500" />
                        <ScoreBar label="Monetisation"     value={idea.monetizationScore}      colour="bg-green-500" />
                        <ScoreBar label="Difficulty (inv)" value={5 - idea.productionDifficulty} colour="bg-amber-500" />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1 flex-wrap">
                      {idea.status === "Draft" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-xs border-green-700/50 text-green-400 hover:border-green-500"
                          disabled={approving === idea.id}
                          onClick={() => approveIdea(idea)}
                        >
                          {approving === idea.id
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <><CheckCircle className="h-3 w-3 mr-1" /> Approve</>}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="h-7 px-2.5 text-xs bg-blue-600 hover:bg-blue-700"
                        disabled={isScripting || !!generatingScript}
                        onClick={() => generateScript(idea)}
                      >
                        {isScripting
                          ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Writing…</>
                          : <><Zap className="h-3 w-3 mr-1" /> Generate Script</>}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-zinc-600 hover:text-red-400 ml-auto"
                        disabled={deleting === idea.id}
                        onClick={() => deleteIdea(idea.id)}
                      >
                        {deleting === idea.id
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <Trash2 className="h-3 w-3" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

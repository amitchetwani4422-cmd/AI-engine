"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Tv, DollarSign, TrendingUp, Loader2, Settings } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface Channel {
  id: string;
  name: string;
  niche: string;
  universe?: string;
  status: string;
  subscriberCount: number;
  postingFrequency?: string;
  maxBudgetPerWeek?: number;
  primaryPlatform: string;
  language: string;
  totalCostThisWeek?: number;
  _count?: { videos: number; ideas: number };
}

const statusColors: Record<string, string> = {
  Testing: "warning",
  Active: "info",
  Scaling: "success",
  Paused: "secondary",
};

const statusDot: Record<string, string> = {
  Testing: "bg-yellow-500",
  Active: "bg-blue-500",
  Scaling: "bg-green-500",
  Paused: "bg-zinc-500",
};

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    niche: "",
    universe: "",
    targetAudience: "",
    primaryPlatform: "YouTube",
    language: "Hindi",
    postingFrequency: "Daily",
    maxBudgetPerWeek: "",
  });

  useEffect(() => {
    fetchChannels();
  }, []);

  async function fetchChannels() {
    try {
      const res = await fetch("/api/channels");
      if (res.ok) {
        const data = await res.json();
        setChannels(data.channels || data || []);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          maxBudgetPerWeek: form.maxBudgetPerWeek
            ? parseFloat(form.maxBudgetPerWeek)
            : undefined,
        }),
      });
      if (res.ok) {
        setDialogOpen(false);
        setForm({
          name: "",
          niche: "",
          universe: "",
          targetAudience: "",
          primaryPlatform: "YouTube",
          language: "Hindi",
          postingFrequency: "Daily",
          maxBudgetPerWeek: "",
        });
        fetchChannels();
      }
    } catch {
      //
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-7xl">
      <Header
        title="Channels"
        description="Manage your 5 YouTube/Instagram channels"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Channel
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-5 space-y-3">
                <div className="h-5 bg-zinc-800 rounded w-2/3" />
                <div className="h-4 bg-zinc-800 rounded w-1/3" />
                <div className="h-2 bg-zinc-800 rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : channels.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Tv className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-300 mb-2">No channels yet</h3>
            <p className="text-zinc-500 mb-6">Create your first channel to get started</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Channel
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {channels.map((ch) => {
            const subPct = Math.min(100, ((ch.subscriberCount || 0) / 500) * 100);
            return (
              <Card
                key={ch.id}
                className="hover:border-zinc-600 transition-colors"
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`h-2 w-2 rounded-full ${statusDot[ch.status] || "bg-zinc-500"}`} />
                        <h3 className="font-semibold text-zinc-100 truncate">{ch.name}</h3>
                      </div>
                      <p className="text-xs text-zinc-500">{ch.niche}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {ch.universe && (
                        <Badge variant="secondary" className="text-xs">U-{ch.universe}</Badge>
                      )}
                      <Badge variant={statusColors[ch.status] as any || "secondary"} className="text-xs">
                        {ch.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-zinc-800/50 rounded-lg p-2">
                      <p className="text-lg font-bold text-zinc-100">
                        {formatNumber(ch.subscriberCount || 0)}
                      </p>
                      <p className="text-xs text-zinc-600">Subs</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-2">
                      <p className="text-lg font-bold text-zinc-100">
                        {ch._count?.videos || 0}
                      </p>
                      <p className="text-xs text-zinc-600">Videos</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-2">
                      <p className="text-lg font-bold text-zinc-100">
                        {ch._count?.ideas || 0}
                      </p>
                      <p className="text-xs text-zinc-600">Ideas</p>
                    </div>
                  </div>

                  {/* YPP Progress */}
                  <div>
                    <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        YPP Progress
                      </span>
                      <span>{subPct.toFixed(0)}%</span>
                    </div>
                    <Progress
                      value={subPct}
                      className="h-1.5"
                      indicatorClassName={
                        subPct >= 100 ? "bg-green-500" : subPct >= 60 ? "bg-yellow-500" : "bg-blue-500"
                      }
                    />
                  </div>

                  {/* Cost & Platform */}
                  {(ch.maxBudgetPerWeek || ch.totalCostThisWeek !== undefined) && (
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatCurrency(ch.totalCostThisWeek || 0)} this week
                      </span>
                      {ch.maxBudgetPerWeek && (
                        <span>Budget: {formatCurrency(ch.maxBudgetPerWeek)}/wk</span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/channels/${ch.id}`}>View Details</Link>
                    </Button>
                    <Button variant="ghost" size="icon-sm" asChild>
                      <Link href={`/channels/${ch.id}?tab=settings`}>
                        <Settings className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Channel Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Channel</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="name">Channel Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Krishna Stories"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="niche">Niche</Label>
                <Input
                  id="niche"
                  placeholder="e.g. Mythology"
                  value={form.niche}
                  onChange={(e) => setForm({ ...form, niche: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Universe</Label>
                <Select
                  value={form.universe}
                  onValueChange={(v) => setForm({ ...form, universe: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select universe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A - Mythology & Bhakti</SelectItem>
                    <SelectItem value="B">B - Character & Entertainment</SelectItem>
                    <SelectItem value="C">C - Cooking Spectacle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="audience">Target Audience</Label>
                <Input
                  id="audience"
                  placeholder="e.g. Hindu devotees, 25-45"
                  value={form.targetAudience}
                  onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Platform</Label>
                <Select
                  value={form.primaryPlatform}
                  onValueChange={(v) => setForm({ ...form, primaryPlatform: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YouTube">YouTube</SelectItem>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="Both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Language</Label>
                <Select
                  value={form.language}
                  onValueChange={(v) => setForm({ ...form, language: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hindi">Hindi</SelectItem>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Telugu">Telugu</SelectItem>
                    <SelectItem value="Tamil">Tamil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Posting Frequency</Label>
                <Select
                  value={form.postingFrequency}
                  onValueChange={(v) => setForm({ ...form, postingFrequency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="2x Weekly">2x Weekly</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="2x Daily">2x Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="budget">Weekly Budget (USD)</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="e.g. 50"
                  value={form.maxBudgetPerWeek}
                  onChange={(e) => setForm({ ...form, maxBudgetPerWeek: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Channel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

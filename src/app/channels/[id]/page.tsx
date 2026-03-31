"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  Video,
  Clock,
  DollarSign,
  Edit,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface Channel {
  id: string;
  name: string;
  niche: string;
  universe?: string;
  status: string;
  subscriberCount: number;
  watchHoursCount?: number;
  shortsViewsCount?: number;
  postingFrequency?: string;
  maxBudgetPerWeek?: number;
  primaryPlatform: string;
  language: string;
  targetAudience?: string;
  contentPillars?: string[];
  formatStrategy?: string;
  defaultModelPref?: string;
  videos?: Array<{
    id: string;
    title: string;
    status: string;
    klingCost?: number;
    veoCost?: number;
    createdAt: string;
  }>;
}

const statusColors: Record<string, string> = {
  Testing: "warning",
  Active: "info",
  Scaling: "success",
  Paused: "secondary",
};

export default function ChannelDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Channel>>({});

  useEffect(() => {
    fetchChannel();
  }, [id]);

  async function fetchChannel() {
    try {
      const res = await fetch(`/api/channels/${id}`);
      if (res.ok) {
        const data = await res.json();
        const ch = data.channel || data;
        setChannel(ch);
        setEditForm(ch);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch(`/api/channels/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      fetchChannel();
    } catch {
      //
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl">
        <div className="h-8 bg-zinc-800 rounded w-48 mb-2 animate-pulse" />
        <div className="h-4 bg-zinc-800 rounded w-32 mb-8 animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-5 h-24" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-400">Channel not found</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/channels">Back to Channels</Link>
        </Button>
      </div>
    );
  }

  const ypp = {
    earlyAccess: {
      subscribers: { current: channel.subscriberCount || 0, goal: 500 },
      watchHours: { current: channel.watchHoursCount || 0, goal: 3000 },
      shortsViews: { current: channel.shortsViewsCount || 0, goal: 3000000 },
    },
    fullRevenue: {
      subscribers: { current: channel.subscriberCount || 0, goal: 1000 },
      watchHours: { current: channel.watchHoursCount || 0, goal: 4000 },
      shortsViews: { current: channel.shortsViewsCount || 0, goal: 10000000 },
    },
  };

  const earlyAccessPct = Math.min(
    100,
    ((ypp.earlyAccess.subscribers.current / ypp.earlyAccess.subscribers.goal) * 100 +
      (ypp.earlyAccess.watchHours.current / ypp.earlyAccess.watchHours.goal) * 100 +
      (ypp.earlyAccess.shortsViews.current / ypp.earlyAccess.shortsViews.goal) * 100) / 3
  );

  return (
    <div className="max-w-5xl">
      <Header
        title={channel.name}
        description={channel.niche}
        breadcrumbs={[
          { label: "Channels", href: "/channels" },
          { label: channel.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {channel.universe && (
              <Badge variant="secondary">Universe {channel.universe}</Badge>
            )}
            <Badge variant={statusColors[channel.status] as any || "secondary"}>
              {channel.status}
            </Badge>
          </div>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="monetization">Monetization</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Subscribers", value: formatNumber(channel.subscriberCount || 0), icon: TrendingUp, color: "text-blue-400" },
              { label: "Videos", value: (channel.videos?.length || 0).toString(), icon: Video, color: "text-purple-400" },
              { label: "Platform", value: channel.primaryPlatform, icon: Clock, color: "text-green-400" },
              { label: "Language", value: channel.language, icon: DollarSign, color: "text-yellow-400" },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                      <p className="text-xs text-zinc-500">{stat.label}</p>
                    </div>
                    <p className="text-xl font-bold text-zinc-100">{stat.value}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {channel.contentPillars && channel.contentPillars.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Content Pillars</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {channel.contentPillars.map((p) => (
                    <Badge key={p} variant="secondary">{p}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {channel.targetAudience && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Target Audience</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-zinc-300 text-sm">{channel.targetAudience}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Top Performing Formats</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {["Mythology Story Arc", "Character Battle", "Devotional Bhajan"].map((fmt, i) => (
                  <div key={fmt} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-600 w-4">{i + 1}</span>
                      <span className="text-sm text-zinc-300">{fmt}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${90 - i * 20}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-500">{90 - i * 20}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monetization Tab */}
        <TabsContent value="monetization" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Early Access */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">YPP Early Access</CardTitle>
                  <Badge variant={earlyAccessPct >= 100 ? "success" : "warning"}>
                    {earlyAccessPct >= 100 ? (
                      <><CheckCircle className="h-3 w-3 mr-1" />Eligible</>
                    ) : (
                      <>{earlyAccessPct.toFixed(0)}% there</>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(ypp.earlyAccess).map(([key, { current, goal }]) => {
                  const pct = Math.min(100, (current / goal) * 100);
                  const labels: Record<string, string> = {
                    subscribers: "500 Subscribers",
                    watchHours: "3,000 Watch Hours",
                    shortsViews: "3M Shorts Views",
                  };
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-zinc-300">{labels[key]}</span>
                        <span className="text-zinc-400">
                          {formatNumber(current)} / {formatNumber(goal)}
                        </span>
                      </div>
                      <Progress
                        value={pct}
                        indicatorClassName={pct >= 100 ? "bg-green-500" : "bg-blue-500"}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Full Revenue */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Full Ad Revenue</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(ypp.fullRevenue).map(([key, { current, goal }]) => {
                  const pct = Math.min(100, (current / goal) * 100);
                  const labels: Record<string, string> = {
                    subscribers: "1,000 Subscribers",
                    watchHours: "4,000 Watch Hours",
                    shortsViews: "10M Shorts Views",
                  };
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-zinc-300">{labels[key]}</span>
                        <span className="text-zinc-400">
                          {formatNumber(current)} / {formatNumber(goal)}
                        </span>
                      </div>
                      <Progress
                        value={pct}
                        indicatorClassName={pct >= 100 ? "bg-green-500" : "bg-purple-500"}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Budget Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Weekly Budget</p>
                  <p className="text-2xl font-bold text-zinc-100">
                    {channel.maxBudgetPerWeek
                      ? formatCurrency(channel.maxBudgetPerWeek)
                      : "Not set"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Spent This Week</p>
                  <p className="text-2xl font-bold text-green-400">
                    {formatCurrency(0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Videos Tab */}
        <TabsContent value="videos" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-zinc-400">
              {channel.videos?.length || 0} videos
            </p>
            <Button size="sm" asChild>
              <Link href={`/scripts?channel=${id}`}>+ New Script</Link>
            </Button>
          </div>
          {!channel.videos || channel.videos.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Video className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-400">No videos yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {channel.videos.map((v) => (
                <Card key={v.id} className="hover:border-zinc-600 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-100 truncate">{v.title}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {new Date(v.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {(v.klingCost || v.veoCost) && (
                        <span className="text-xs text-zinc-500">
                          {formatCurrency((v.klingCost || 0) + (v.veoCost || 0))}
                        </span>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {v.status}
                      </Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/production/${v.id}`}>View</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4 max-w-lg">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Channel Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Channel Name</Label>
                <Input
                  value={editForm.name || ""}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Niche</Label>
                <Input
                  value={editForm.niche || ""}
                  onChange={(e) => setEditForm({ ...editForm, niche: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={editForm.status || ""}
                    onValueChange={(v) => setEditForm({ ...editForm, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Testing">Testing</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Scaling">Scaling</SelectItem>
                      <SelectItem value="Paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Default Model</Label>
                  <Select
                    value={editForm.defaultModelPref || ""}
                    onValueChange={(v) => setEditForm({ ...editForm, defaultModelPref: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Auto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="kling-3.0">Kling 3.0</SelectItem>
                      <SelectItem value="veo-3.1">Veo 3.1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Weekly Budget (USD)</Label>
                <Input
                  type="number"
                  value={editForm.maxBudgetPerWeek || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, maxBudgetPerWeek: parseFloat(e.target.value) || undefined })
                  }
                />
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

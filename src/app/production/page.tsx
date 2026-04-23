"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Video, Play, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ProductionVideo {
  id: string;
  title: string;
  status: string;
  channelId: string;
  channel?: { name: string };
  totalCost: number;
  klingCost: number;
  veoCost: number;
  formatVariant: string;
  createdAt: string;
  _count?: { generatedClips: number };
  sceneCount?: number;
}

const statusOrder = [
  "InProduction",
  "Pending",
  "Generating",
  "Assembly",
  "QualityCheck",
  "Packaging",
  "ReadyToPublish",
  "Published",
  "Rejected",
];

const statusColors: Record<string, string> = {
  InProduction: "bg-blue-500/20 text-blue-400",
  Pending: "bg-zinc-700 text-zinc-300",
  Generating: "bg-yellow-500/20 text-yellow-400",
  Assembly: "bg-blue-500/20 text-blue-400",
  QualityCheck: "bg-orange-500/20 text-orange-400",
  Packaging: "bg-cyan-500/20 text-cyan-400",
  ReadyToPublish: "bg-green-500/20 text-green-400",
  Published: "bg-green-700/40 text-green-300",
  Rejected: "bg-red-500/20 text-red-400",
};

export default function ProductionPage() {
  const [videos, setVideos] = useState<ProductionVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("all");

  useEffect(() => {
    fetchVideos();
  }, []);

  async function fetchVideos() {
    setLoading(true);
    try {
      const res = await fetch("/api/production");
      const data = await res.json();
      setVideos(Array.isArray(data) ? data : data.videos ?? []);
    } catch {
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }

  const grouped = statusOrder.reduce(
    (acc, status) => {
      acc[status] = videos.filter((v) => v.status === status);
      return acc;
    },
    {} as Record<string, ProductionVideo[]>
  );

  const filtered = activeStatus === "all" ? videos : (grouped[activeStatus] ?? []);

  const activeCounts = statusOrder.reduce(
    (acc, s) => ({ ...acc, [s]: (grouped[s] ?? []).length }),
    {} as Record<string, number>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header
        title="Video Production"
        description="Orchestrate scene generation, assembly, and quality review"
      />
      <div className="flex-1 overflow-auto p-6">
        {/* Pipeline status tabs */}
        <div className="flex gap-1.5 mb-6 flex-wrap">
          <button
            onClick={() => setActiveStatus("all")}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${activeStatus === "all" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"}`}
          >
            All ({videos.length})
          </button>
          {statusOrder.map((status) => (
            activeCounts[status] > 0 && (
              <button
                key={status}
                onClick={() => setActiveStatus(status)}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${activeStatus === status ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"}`}
              >
                {status} ({activeCounts[status]})
              </button>
            )
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Video className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 mb-2">No videos in production</p>
            <p className="text-zinc-600 text-sm mb-6">Approve a script and start production from the Scripts page</p>
            <Button asChild variant="outline">
              <Link href="/scripts">Go to Scripts</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((video) => (
              <Link key={video.id} href={`/production/${video.id}`}>
                <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-medium text-zinc-100 truncate">{video.title}</p>
                          <Badge className={statusColors[video.status] ?? "bg-zinc-700 text-zinc-300"}>
                            {video.status}
                          </Badge>
                          <Badge className="bg-zinc-800 text-zinc-400">{video.formatVariant}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                          {video.channel && <span>{video.channel.name}</span>}
                          {video._count && <span>{video._count.generatedClips} clips</span>}
                          {video.sceneCount && <span>{video.sceneCount} scenes</span>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-medium text-green-400">{formatCurrency(video.totalCost)}</p>
                        <div className="flex gap-2 text-xs mt-0.5">
                          <span className="text-blue-400">K: {formatCurrency(video.klingCost)}</span>
                          <span className="text-purple-400">V: {formatCurrency(video.veoCost)}</span>
                        </div>
                        <p className="text-xs text-zinc-600 mt-1">{new Date(video.createdAt).toLocaleDateString()}</p>
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

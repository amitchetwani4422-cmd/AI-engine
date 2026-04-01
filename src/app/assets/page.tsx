"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HardDrive, Loader2, Search, Image as ImageIcon, Film, Mic, FileText } from "lucide-react";

interface Asset {
  id: string; name: string; type: string; url: string; channelId?: string;
  model?: string; status: string; tags: string[]; createdAt: string;
  metadata?: Record<string, unknown>;
}

const ASSET_TYPES = ["all", "character-ref", "voice", "script", "scene-prompt", "world-preset", "thumbnail", "raw-clip", "approved-clip", "final-video", "rejected-clip", "music"];

const typeIcon: Record<string, React.ReactNode> = {
  "character-ref": <ImageIcon className="h-4 w-4" />,
  thumbnail: <ImageIcon className="h-4 w-4" />,
  "raw-clip": <Film className="h-4 w-4" />,
  "approved-clip": <Film className="h-4 w-4" />,
  "final-video": <Film className="h-4 w-4" />,
  "rejected-clip": <Film className="h-4 w-4" />,
  voice: <Mic className="h-4 w-4" />,
  script: <FileText className="h-4 w-4" />,
};

const statusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  approved: "bg-blue-500/20 text-blue-400",
  rejected: "bg-red-500/20 text-red-400",
  salvage: "bg-yellow-500/20 text-yellow-400",
};

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAssets();
  }, [typeFilter]);

  async function fetchAssets() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      const d = await fetch(`/api/assets?${params}`).then((r) => r.json());
      setAssets(Array.isArray(d) ? d : []);
    } finally { setLoading(false); }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/assets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchAssets();
  }

  const filtered = assets.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header title="Asset Library" description="All outputs and reusable assets" />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input className="pl-9" placeholder="Search assets..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ASSET_TYPES.map((t) => <SelectItem key={t} value={t}>{t === "all" ? "All Types" : t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <HardDrive className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">No assets found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((asset) => (
              <Card key={asset.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-colors">
                <CardContent className="p-3">
                  {/* Preview */}
                  <div className="w-full aspect-video bg-zinc-800 rounded mb-3 overflow-hidden flex items-center justify-center">
                    {["thumbnail", "character-ref"].includes(asset.type) ? (
                      <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div className="text-zinc-600">{typeIcon[asset.type] ?? <HardDrive className="h-6 w-6" />}</div>
                    )}
                  </div>

                  <p className="text-sm font-medium text-zinc-200 truncate mb-1">{asset.name}</p>
                  <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                    <Badge className="bg-zinc-800 text-zinc-400 text-xs">{asset.type}</Badge>
                    <Badge className={`text-xs ${statusColors[asset.status] ?? "bg-zinc-800 text-zinc-400"}`}>{asset.status}</Badge>
                    {asset.model && (
                      <Badge className={`text-xs ${asset.model === "kling-3.0" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"}`}>
                        {asset.model}
                      </Badge>
                    )}
                  </div>

                  {asset.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {asset.tags.slice(0, 3).map((tag) => <span key={tag} className="text-xs text-zinc-600">{tag}</span>)}
                    </div>
                  )}

                  <div className="flex gap-1 mt-2">
                    <Button size="sm" variant="ghost" className="flex-1 text-xs h-7" onClick={() => window.open(asset.url, "_blank")}>View</Button>
                    {asset.status !== "approved" && (
                      <Button size="sm" variant="ghost" className="flex-1 text-xs h-7 text-green-400" onClick={() => updateStatus(asset.id, "approved")}>Approve</Button>
                    )}
                    {asset.status !== "rejected" && (
                      <Button size="sm" variant="ghost" className="flex-1 text-xs h-7 text-red-400" onClick={() => updateStatus(asset.id, "rejected")}>Reject</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

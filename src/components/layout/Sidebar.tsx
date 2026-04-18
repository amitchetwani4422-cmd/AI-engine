"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useChannel } from "@/lib/channel-context";
import {
  Brain,
  Home,
  Tv,
  Search,
  Calendar,
  FileText,
  Users,
  Code,
  Palette,
  Video,
  Mic,
  Layers,
  Package,
  Upload,
  MapPin,
  Star,
  HardDrive,
  BarChart,
  Globe,
  Eye,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Zap,
  Lightbulb,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: Home, href: "/" },
  { label: "Channels", icon: Tv, href: "/channels" },
  { label: "Ideas", icon: Lightbulb, href: "/ideas" },
  { label: "Arc Generator", icon: Zap, href: "/arcs" },
  { label: "Research", icon: Search, href: "/research" },
  { label: "Planner", icon: Calendar, href: "/planner" },
  { label: "Scripts", icon: FileText, href: "/scripts" },
  { label: "Characters", icon: Users, href: "/characters" },
  { label: "Locations", icon: MapPin, href: "/locations" },
  { label: "Prompts", icon: Code, href: "/prompts" },
  { label: "Style Bible", icon: Palette, href: "/style-bible" },
  { label: "Production", icon: Video, href: "/production" },
  { label: "Voice & Audio", icon: Mic, href: "/voice" },
  { label: "Series", icon: Layers, href: "/series" },
  { label: "Packaging", icon: Package, href: "/packaging" },
  { label: "Publishing", icon: Upload, href: "/publishing" },
  { label: "Quality", icon: Star, href: "/quality" },
  { label: "Assets", icon: HardDrive, href: "/assets" },
  { label: "Analytics", icon: BarChart, href: "/analytics" },
  { label: "Cultural Calendar", icon: Globe, href: "/cultural-calendar" },
  { label: "Competitor Refs", icon: Eye, href: "/competitors" },
  { label: "Playbooks", icon: BookOpen, href: "/playbooks" },
];

const universeColor: Record<string, string> = {
  A: "bg-orange-500/20 text-orange-400",
  B: "bg-blue-500/20 text-blue-400",
  C: "bg-green-500/20 text-green-400",
};

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [channelMenuOpen, setChannelMenuOpen] = useState(false);
  const { channels, activeChannel, setActiveChannelId, loading: channelsLoading } = useChannel();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div
        className={cn(
          "flex items-center border-b border-zinc-800 px-4 py-4",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-100 truncate">
                AI Content Engine
              </p>
              <p className="text-xs text-zinc-500 truncate">Amit's Studio</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Brain className="h-4 w-4 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "hidden lg:flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors",
            collapsed && "mt-0"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Channel Selector */}
      {!collapsed && (
        <div className="relative px-3 py-2 border-b border-zinc-800">
          <button
            onClick={() => setChannelMenuOpen((o) => !o)}
            className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-zinc-800 transition-colors text-left"
            disabled={channelsLoading || channels.length === 0}
          >
            <Tv className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
            <div className="flex-1 min-w-0">
              {channelsLoading ? (
                <span className="text-zinc-600 text-xs">Loading channels...</span>
              ) : activeChannel ? (
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="truncate text-zinc-200 text-xs font-medium">{activeChannel.name}</span>
                  <span className={cn("text-[10px] px-1 py-0.5 rounded shrink-0", universeColor[activeChannel.universe] ?? "bg-zinc-800 text-zinc-400")}>
                    U{activeChannel.universe}
                  </span>
                </div>
              ) : (
                <span className="text-zinc-500 text-xs">No channels</span>
              )}
            </div>
            {channels.length > 0 && <ChevronDown className={cn("h-3 w-3 text-zinc-500 shrink-0 transition-transform", channelMenuOpen && "rotate-180")} />}
          </button>

          {channelMenuOpen && channels.length > 0 && (
            <div className="absolute left-3 right-3 top-full mt-1 z-50 rounded-md bg-zinc-900 border border-zinc-700 shadow-xl overflow-hidden">
              {channels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => {
                    setActiveChannelId(ch.id);
                    setChannelMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-zinc-800 transition-colors",
                    ch.id === activeChannel?.id && "bg-blue-600/10 text-blue-400"
                  )}
                >
                  <span className={cn("text-[10px] px-1 py-0.5 rounded shrink-0 font-medium", universeColor[ch.universe] ?? "bg-zinc-800 text-zinc-400")}>
                    U{ch.universe}
                  </span>
                  <span className="truncate">{ch.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors group",
                active
                  ? "bg-blue-600/15 text-blue-400 border border-blue-600/20"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 border border-transparent",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-300"
                )}
              />
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-zinc-800 px-4 py-3">
          <p className="text-xs text-zinc-600">v0.1.0 · Internal Tool</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden flex h-9 w-9 items-center justify-center rounded-md bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-zinc-100"
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-zinc-950 border-r border-zinc-800 transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 bg-zinc-950 border-r border-zinc-800 transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}

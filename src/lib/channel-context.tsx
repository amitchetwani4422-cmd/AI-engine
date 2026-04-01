"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

interface Channel {
  id: string;
  name: string;
  universe: string;
  niche: string;
  status: string;
}

interface ChannelContextValue {
  channels: Channel[];
  activeChannelId: string | null;
  activeChannel: Channel | null;
  setActiveChannelId: (id: string) => void;
  loading: boolean;
}

const ChannelContext = createContext<ChannelContextValue>({
  channels: [],
  activeChannelId: null,
  activeChannel: null,
  setActiveChannelId: () => {},
  loading: true,
});

const STORAGE_KEY = "ace_active_channel_id";

export function ChannelProvider({ children }: { children: React.ReactNode }) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadChannels = useCallback(async () => {
    try {
      const r = await fetch("/api/channels");
      const data = await r.json();
      if (Array.isArray(data) && data.length > 0) {
        setChannels(data);
        const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
        const valid = stored && (data as Channel[]).find((c) => c.id === stored);
        setActiveChannelIdState(valid ? stored! : data[0].id);
        return;
      }
      // DB is empty — auto-seed the 5 default channels then reload
      if (Array.isArray(data) && data.length === 0) {
        await fetch("/api/seed", { method: "POST" });
        const r2 = await fetch("/api/channels");
        const data2 = await r2.json();
        if (Array.isArray(data2) && data2.length > 0) {
          setChannels(data2);
          setActiveChannelIdState(data2[0].id);
        }
      }
    } catch {
      // silently ignore — UI shows "No channels"
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  const setActiveChannelId = useCallback((id: string) => {
    setActiveChannelIdState(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, id);
    }
  }, []);

  const activeChannel = channels.find((c) => c.id === activeChannelId) ?? null;

  return (
    <ChannelContext.Provider value={{ channels, activeChannelId, activeChannel, setActiveChannelId, loading }}>
      {children}
    </ChannelContext.Provider>
  );
}

export function useChannel() {
  return useContext(ChannelContext);
}

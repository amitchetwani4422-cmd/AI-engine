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

  useEffect(() => {
    fetch("/api/channels?limit=20")
      .then((r) => r.json())
      .then((data: Channel[] | { error?: string }) => {
        if (Array.isArray(data) && data.length > 0) {
          setChannels(data);
          const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
          const valid = stored && data.find((c) => c.id === stored);
          setActiveChannelIdState(valid ? stored : data[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

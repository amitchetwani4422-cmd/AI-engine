"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";

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
  reload: () => void;
}

const ChannelContext = createContext<ChannelContextValue>({
  channels: [],
  activeChannelId: null,
  activeChannel: null,
  setActiveChannelId: () => {},
  loading: true,
  reload: () => {},
});

const STORAGE_KEY = "ace_active_channel_id";

async function fetchChannels(): Promise<Channel[]> {
  const r = await fetch("/api/channels");
  const data = await r.json();
  return Array.isArray(data) ? data : [];
}

export function ChannelProvider({ children }: { children: React.ReactNode }) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Prevent concurrent seed calls
  const seeding = useRef(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchChannels();

      if (data.length > 0) {
        // Deduplicate by name — prevents same-name channels created via race condition
        // from showing twice in the UI (seed cleans DB, this guards the render layer)
        const seenNames = new Set<string>();
        const unique = data.filter((c) => {
          const key = c.name.toLowerCase().trim();
          if (seenNames.has(key)) return false;
          seenNames.add(key);
          return true;
        });
        setChannels(unique);
        const stored = localStorage.getItem(STORAGE_KEY);
        const valid = stored && unique.find((c) => c.id === stored);
        setActiveChannelIdState(valid ? stored! : unique[0].id);
        return;
      }

      // DB is empty and no seed in flight — seed once
      if (!seeding.current) {
        seeding.current = true;
        try {
          await fetch("/api/seed", { method: "POST" });
          const seeded = await fetchChannels();
          if (seeded.length > 0) {
            setChannels(seeded);
            setActiveChannelIdState(seeded[0].id);
          }
        } finally {
          seeding.current = false;
        }
      }
    } catch {
      // DB unavailable — show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setActiveChannelId = useCallback((id: string) => {
    setActiveChannelIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const activeChannel = channels.find((c) => c.id === activeChannelId) ?? null;

  return (
    <ChannelContext.Provider value={{ channels, activeChannelId, activeChannel, setActiveChannelId, loading, reload: load }}>
      {children}
    </ChannelContext.Provider>
  );
}

export function useChannel() {
  return useContext(ChannelContext);
}

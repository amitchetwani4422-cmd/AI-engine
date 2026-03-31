import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

export const CHANNELS_CONFIG = {
  universes: {
    A: { name: "Mythology and Bhakti", channels: ["mythology", "bhakti"] },
    B: { name: "Character and Entertainment IP", channels: ["cartoon", "creature"] },
    C: { name: "Cooking Spectacle", channels: ["cooking"] },
  },
  modelRouting: {
    "character-action": "kling-3.0",
    "multi-shot": "kling-3.0",
    "creature-mascot": "kling-3.0",
    "cooking-vfx": "kling-3.0",
    "cartoon-episode": "kling-3.0",
    "battle-action": "kling-3.0",
    "high-volume": "kling-3.0",
    "character-speaking": "veo-3.1",
    "bhajan-lipsync": "veo-3.1",
    "devotional-closeup": "veo-3.1",
    "cinematic-hero": "veo-3.1",
    "mythology-narration": "veo-3.1",
  } as Record<string, string>,
  qualityThresholds: {
    approve: 4.5,
    revise: 3.5,
    regenerate: 2.5,
  },
  yppThresholds: {
    earlyAccess: {
      subscribers: 500,
      uploads: 3,
      watchHours: 3000,
      shortsViews: 3000000,
    },
    fullAdRevenue: {
      subscribers: 1000,
      watchHours: 4000,
      shortsViews: 10000000,
    },
  },
};

import type { Stats } from "@/types/card";
import type { FeedItem } from "@/types/feed";

const PROGRESS_KEY = "phrase_feed_feed_progress_v2";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface FeedProgress {
  feed: FeedItem[];
  index: number;
  combo: number;
  isFlipped: boolean;
  stats: Stats | null;
  savedAt: number;
}

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function getFeedProgress(): FeedProgress | null {
  const progress = readJson<FeedProgress>(PROGRESS_KEY);
  if (!progress) return null;
  if (Date.now() - progress.savedAt > MAX_AGE_MS) {
    clearFeedProgress();
    return null;
  }
  if (!progress.feed.length || progress.index >= progress.feed.length) {
    clearFeedProgress();
    return null;
  }
  return progress;
}

export function saveFeedProgress(progress: Omit<FeedProgress, "savedAt">): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    PROGRESS_KEY,
    JSON.stringify({ ...progress, savedAt: Date.now() } satisfies FeedProgress),
  );
}

export function clearFeedProgress(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROGRESS_KEY);
}

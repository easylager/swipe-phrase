import type { Card, ReviewRating, SnoozeDays, Stats } from "@/types/card";
import type { User } from "@/types/user";
import { clearFeedProgress } from "@/lib/feedProgress";

const CACHE_KEY = "phrase_feed_offline_cache";
const PENDING_KEY = "phrase_feed_pending_reviews";
const PENDING_SNOOZES_KEY = "phrase_feed_pending_snoozes";
const USER_KEY = "phrase_feed_cached_user";

interface OfflineCache {
  session: Card[];
  stats: Stats;
  cachedAt: number;
}

export interface PendingReview {
  id: string;
  cardId: number;
  rating: ReviewRating;
  flipLatencyMs?: number;
  answerLatencyMs?: number;
  comboAfter?: number;
  promptLang?: "en" | "ru";
  createdAt: number;
}

export interface PendingSnooze {
  id: string;
  cardId: number;
  days: SnoozeDays;
  createdAt: number;
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

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getOfflineCache(): OfflineCache | null {
  return readJson<OfflineCache>(CACHE_KEY);
}

export function setOfflineCache(session: Card[], stats: Stats): void {
  writeJson(CACHE_KEY, {
    session,
    stats,
    cachedAt: Date.now(),
  } satisfies OfflineCache);
}

export function getCachedSession(): Card[] | null {
  return getOfflineCache()?.session ?? null;
}

export function getCachedStats(): Stats | null {
  return getOfflineCache()?.stats ?? null;
}

export function bumpCachedSwipeCount(): Stats | null {
  const cache = getOfflineCache();
  if (!cache) return null;

  const stats: Stats = {
    ...cache.stats,
    swipes_today: cache.stats.swipes_today + 1,
  };
  setOfflineCache(cache.session, stats);
  return stats;
}

export function getCachedCard(cardId: number): Card | null {
  return getCachedSession()?.find((c) => c.id === cardId) ?? null;
}

export function getPendingReviews(): PendingReview[] {
  return readJson<PendingReview[]>(PENDING_KEY) ?? [];
}

export function enqueueReview(review: Omit<PendingReview, "id" | "createdAt">): PendingReview {
  const entry: PendingReview = {
    ...review,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  writeJson(PENDING_KEY, [...getPendingReviews(), entry]);
  return entry;
}

export function removePendingReview(id: string): void {
  writeJson(
    PENDING_KEY,
    getPendingReviews().filter((r) => r.id !== id),
  );
}

export function getPendingSnoozes(): PendingSnooze[] {
  return readJson<PendingSnooze[]>(PENDING_SNOOZES_KEY) ?? [];
}

export function enqueueSnooze(snooze: Omit<PendingSnooze, "id" | "createdAt">): PendingSnooze {
  const entry: PendingSnooze = {
    ...snooze,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  writeJson(PENDING_SNOOZES_KEY, [...getPendingSnoozes(), entry]);
  return entry;
}

export function removePendingSnooze(id: string): void {
  writeJson(
    PENDING_SNOOZES_KEY,
    getPendingSnoozes().filter((s) => s.id !== id),
  );
}

export function getPendingActionCount(): number {
  return getPendingReviews().length + getPendingSnoozes().length;
}

export function applyCachedSnooze(cardId: number, days: number): Card | null {
  const cache = getOfflineCache();
  if (!cache) return null;

  const due = new Date(Date.now() + days * 86_400_000).toISOString();
  const session = cache.session.map((card) =>
    card.id === cardId ? { ...card, due } : card,
  );
  setOfflineCache(session, cache.stats);
  return session.find((card) => card.id === cardId) ?? null;
}

/** Reflect Выучил locally so offline session rebuilds don't revive EN faces. */
export function applyCachedReview(
  cardId: number,
  rating: ReviewRating,
  promptLang?: "en" | "ru",
): Card | null {
  const cache = getOfflineCache();
  if (!cache) return null;

  if (rating === "graduated" && promptLang !== "en") {
    const removed = cache.session.find((card) => card.id === cardId) ?? null;
    setOfflineCache(
      cache.session.filter((card) => card.id !== cardId),
      cache.stats,
    );
    return removed ? { ...removed, learned_en: true, state: "graduated" } : null;
  }

  const session = cache.session.map((card) => {
    if (card.id !== cardId) return card;
    if (rating === "graduated" && promptLang === "en") {
      return { ...card, learned_en: true, prompt_lang: "ru" as const };
    }
    return card;
  });
  setOfflineCache(session, cache.stats);
  return session.find((card) => card.id === cardId) ?? null;
}

export function getCachedUser(): User | null {
  return readJson<User>(USER_KEY);
}

export function setCachedUser(user: User): void {
  writeJson(USER_KEY, user);
}

export function clearOfflineData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(PENDING_KEY);
  localStorage.removeItem(PENDING_SNOOZES_KEY);
  localStorage.removeItem(USER_KEY);
  clearFeedProgress();
}

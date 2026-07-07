import type {
  Card,
  CreateCardPayload,
  DailyStats,
  MatchdayStats,
  ReviewRating,
  SnoozeDays,
  Stats,
  UpdateCardPayload,
  VocabularyStats,
} from "@/types/card";
import type { AuthResponse, User } from "@/types/user";
import { getToken } from "@/lib/auth";
import {
  applyCachedSnooze,
  bumpCachedSwipeCount,
  enqueueReview,
  enqueueSnooze,
  getCachedCard,
  getCachedSession,
  getCachedStats,
  getPendingReviews,
  getPendingSnoozes,
  removePendingReview,
  removePendingSnooze,
  setCachedUser,
  setOfflineCache,
} from "@/lib/offlineStore";
import { fetchWithTimeout, isBrowserOnline, isNetworkError, AuthError, NetworkError } from "@/lib/network";

const API_PORT = process.env.NEXT_PUBLIC_API_PORT ?? "8001";

type RequestOptions = RequestInit & { forceOnline?: boolean };

/** Resolve API base URL for local dev and Railway production. */
function getApiBase(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (configured) return configured;

  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:${API_PORT}`;
  }

  return `http://localhost:${API_PORT}`;
}

async function parseError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const json = JSON.parse(text) as { detail?: string | { msg: string }[] };
    if (typeof json.detail === "string") {
      if (json.detail === "User not found") {
        return "Сессия устарела. Войди снова (сервер мог перезапуститься).";
      }
      if (json.detail === "Invalid email or password") {
        return "Неверный email или пароль. Если только что зарегистрировался — база могла сброситься, зарегистрируйся снова.";
      }
      return json.detail;
    }
    if (Array.isArray(json.detail) && json.detail[0]?.msg) return json.detail[0].msg;
  } catch {
    /* plain text */
  }
  return text || `Request failed: ${res.status}`;
}

function notifyAuthExpired() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth:expired"));
  }
}

function notifyPendingReviewsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("offline:pending-changed"));
  }
}

function cacheSessionAndStats(session: Card[], stats: Stats) {
  setOfflineCache(session, stats);
}

function offlineSession(): Card[] {
  const cached = getCachedSession();
  if (!cached) throw new NetworkError("Нет сохранённой сессии для офлайн-режима");
  return cached;
}

function offlineStats(): Stats {
  const cached = getCachedStats();
  if (!cached) throw new NetworkError("Нет сохранённой статистики для офлайн-режима");
  return cached;
}

function offlineReview(
  cardId: number,
  rating: ReviewRating,
  flipLatencyMs?: number,
  answerLatencyMs?: number,
  comboAfter?: number,
): Card {
  enqueueReview({ cardId, rating, flipLatencyMs, answerLatencyMs, comboAfter });
  notifyPendingReviewsChanged();
  bumpCachedSwipeCount();
  return getCachedCard(cardId) ?? ({ id: cardId } as Card);
}

function offlineSnooze(cardId: number, days: SnoozeDays): Card {
  enqueueSnooze({ cardId, days });
  notifyPendingReviewsChanged();
  return applyCachedSnooze(cardId, days) ?? getCachedCard(cardId) ?? ({ id: cardId } as Card);
}

function handleOfflinePost(path: string, body: Record<string, unknown>): Card | undefined {
  const reviewMatch = path.match(/\/api\/cards\/(\d+)\/review$/);
  if (reviewMatch) {
    return offlineReview(
      Number(reviewMatch[1]),
      body.rating as ReviewRating,
      (body.flip_latency_ms as number | null) ?? undefined,
      (body.answer_latency_ms as number | null) ?? undefined,
      (body.combo_after as number | null) ?? undefined,
    );
  }

  const snoozeMatch = path.match(/\/api\/cards\/(\d+)\/snooze$/);
  if (snoozeMatch) {
    return offlineSnooze(Number(snoozeMatch[1]), body.days as SnoozeDays);
  }

  return undefined;
}

async function request<T>(path: string, options?: RequestOptions): Promise<T> {
  const method = (options?.method ?? "GET").toUpperCase();
  const forceOnline = options?.forceOnline ?? false;

  if (!forceOnline && !isBrowserOnline()) {
    if (method === "GET" && path === "/api/session") return offlineSession() as T;
    if (method === "GET" && path === "/api/stats") return offlineStats() as T;
    if (method === "POST" && (path.endsWith("/review") || path.endsWith("/snooze"))) {
      const body = options?.body ? (JSON.parse(options.body as string) as Record<string, unknown>) : {};
      const result = handleOfflinePost(path, body);
      if (result) return result as T;
    }
    throw new NetworkError();
  }

  const token = getToken();
  const fetchOptions = { ...options };
  delete fetchOptions.forceOnline;

  try {
    const res = await fetchWithTimeout(`${getApiBase()}${path}`, {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...fetchOptions.headers,
      },
    });

    if (res.status === 401 && token) {
      notifyAuthExpired();
      throw new AuthError(await parseError(res));
    }

    if (!res.ok) {
      throw new Error(await parseError(res));
    }

    const data = (await res.json()) as T;

    if (method === "GET" && path === "/api/session") {
      const stats = getCachedStats();
      if (stats) cacheSessionAndStats(data as Card[], stats);
    }
    if (method === "GET" && path === "/api/stats") {
      const session = getCachedSession();
      if (session) cacheSessionAndStats(session, data as Stats);
    }
    if (method === "GET" && path === "/api/auth/me") {
      setCachedUser(data as User);
    }

    return data;
  } catch (err) {
    if (!forceOnline && isNetworkError(err)) {
      if (method === "GET" && path === "/api/session") return offlineSession() as T;
      if (method === "GET" && path === "/api/stats") return offlineStats() as T;
      if (method === "POST" && (path.endsWith("/review") || path.endsWith("/snooze"))) {
        const body = options?.body ? (JSON.parse(options.body as string) as Record<string, unknown>) : {};
        const result = handleOfflinePost(path, body);
        if (result) return result as T;
      }
    }
    throw err;
  }
}

export async function syncPendingReviews(): Promise<number> {
  if (!isBrowserOnline()) return 0;

  let synced = 0;

  for (const review of getPendingReviews()) {
    try {
      await request<Card>(`/api/cards/${review.cardId}/review`, {
        method: "POST",
        forceOnline: true,
        body: JSON.stringify({
          rating: review.rating,
          flip_latency_ms: review.flipLatencyMs ?? null,
          answer_latency_ms: review.answerLatencyMs ?? null,
          combo_after: review.comboAfter ?? null,
        }),
      });
      removePendingReview(review.id);
      synced += 1;
    } catch (err) {
      if (isNetworkError(err)) break;
      removePendingReview(review.id);
    }
  }

  for (const snooze of getPendingSnoozes()) {
    try {
      await request<Card>(`/api/cards/${snooze.cardId}/snooze`, {
        method: "POST",
        forceOnline: true,
        body: JSON.stringify({ days: snooze.days }),
      });
      removePendingSnooze(snooze.id);
      synced += 1;
    } catch (err) {
      if (isNetworkError(err)) break;
      removePendingSnooze(snooze.id);
    }
  }

  if (synced > 0) notifyPendingReviewsChanged();
  return synced;
}

export const api = {
  register: (email: string, password: string) =>
    request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<User>("/api/auth/me"),

  getSession: async () => {
    const session = await request<Card[]>("/api/session");
    const stats = getCachedStats();
    if (stats) cacheSessionAndStats(session, stats);
    return session;
  },
  getStats: async () => {
    const stats = await request<Stats>("/api/stats");
    const session = getCachedSession();
    if (session) cacheSessionAndStats(session, stats);
    return stats;
  },
  getMatchdayStats: () => request<MatchdayStats>("/api/stats/matchday"),
  getDailyStats: (days = 14) => request<DailyStats>(`/api/stats/daily?days=${days}`),
  getVocabularyStats: () => request<VocabularyStats>("/api/stats/vocabulary"),
  listCards: () => request<Card[]>("/api/cards"),
  createCard: (payload: CreateCardPayload) =>
    request<Card>("/api/cards", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateCard: (cardId: number, payload: UpdateCardPayload) =>
    request<Card>(`/api/cards/${cardId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  submitReview: (
    cardId: number,
    rating: ReviewRating,
    flipLatencyMs?: number,
    answerLatencyMs?: number,
    comboAfter?: number,
  ) =>
    request<Card>(`/api/cards/${cardId}/review`, {
      method: "POST",
      body: JSON.stringify({
        rating,
        flip_latency_ms: flipLatencyMs ?? null,
        answer_latency_ms: answerLatencyMs ?? null,
        combo_after: comboAfter ?? null,
      }),
    }),
  snoozeCard: (cardId: number, days: SnoozeDays) =>
    request<Card>(`/api/cards/${cardId}/snooze`, {
      method: "POST",
      body: JSON.stringify({ days }),
    }),
  getCard: (cardId: number) => request<Card>(`/api/cards/${cardId}`),
  requestOverview: (cardId: number, force = false) =>
    request<Card>(`/api/cards/${cardId}/overview`, {
      method: "POST",
      body: JSON.stringify({ force }),
    }),
  regenerateOverview: (cardId: number) =>
    request<Card>(`/api/cards/${cardId}/overview/regenerate`, { method: "POST" }),
};

export { getPendingReviews };

import type { Card, CreateCardPayload, DailyStats, ReviewRating, Stats, UpdateCardPayload } from "@/types/card";

const API_PORT = process.env.NEXT_PUBLIC_API_PORT ?? "8001";

/** Resolve API base URL for local dev and Railway production. */
function getApiBase(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (configured) return configured;

  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:${API_PORT}`;
  }

  return `http://localhost:${API_PORT}`;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  getSession: () => request<Card[]>("/api/session"),
  getStats: () => request<Stats>("/api/stats"),
  getDailyStats: (days = 14) => request<DailyStats>(`/api/stats/daily?days=${days}`),
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
  ) =>
    request<Card>(`/api/cards/${cardId}/review`, {
      method: "POST",
      body: JSON.stringify({
        rating,
        flip_latency_ms: flipLatencyMs ?? null,
        answer_latency_ms: answerLatencyMs ?? null,
      }),
    }),
  getCard: (cardId: number) => request<Card>(`/api/cards/${cardId}`),
  /** Request overview on demand; returns cached card when already ready. */
  requestOverview: (cardId: number, force = false) =>
    request<Card>(`/api/cards/${cardId}/overview`, {
      method: "POST",
      body: JSON.stringify({ force }),
    }),
  regenerateOverview: (cardId: number) =>
    request<Card>(`/api/cards/${cardId}/overview/regenerate`, { method: "POST" }),
};

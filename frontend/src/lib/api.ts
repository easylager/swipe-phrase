import type { Card, CreateCardPayload, DailyStats, ReviewRating, Stats, UpdateCardPayload } from "@/types/card";
import type { AuthResponse, User } from "@/types/user";
import { clearToken, getToken } from "@/lib/auth";

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

async function parseError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const json = JSON.parse(text) as { detail?: string | { msg: string }[] };
    if (typeof json.detail === "string") return json.detail;
    if (Array.isArray(json.detail) && json.detail[0]?.msg) return json.detail[0].msg;
  } catch {
    /* plain text */
  }
  return text || `Request failed: ${res.status}`;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${getApiBase()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (res.status === 401 && token) {
    clearToken();
  }

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return res.json() as Promise<T>;
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
  requestOverview: (cardId: number, force = false) =>
    request<Card>(`/api/cards/${cardId}/overview`, {
      method: "POST",
      body: JSON.stringify({ force }),
    }),
  regenerateOverview: (cardId: number) =>
    request<Card>(`/api/cards/${cardId}/overview/regenerate`, { method: "POST" }),
};

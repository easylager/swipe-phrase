export type PromptLang = "en" | "ru";

export interface Card {
  id: number;
  english: string;
  translation: string;
  context: string | null;
  cluster: string | null;
  overview: string | null;
  overview_status: "pending" | "generating" | "ready" | "failed" | "skipped";
  state: string;
  due: string;
  bucket?: string | null;
  /** Random front language for this session appearance — client-side only. */
  prompt_lang?: PromptLang;
}

export interface Stats {
  swipes_today: number;
}

export interface DailySwipeStat {
  date: string;
  count: number;
}

export interface DailyStats {
  days: DailySwipeStat[];
  total: number;
}

export interface CreateCardPayload {
  english: string;
  translation: string;
  context?: string;
  cluster?: string;
}

export interface UpdateCardPayload {
  english: string;
  translation: string;
  context?: string;
  cluster?: string;
}

export type ReviewRating = "again" | "good" | "graduated";

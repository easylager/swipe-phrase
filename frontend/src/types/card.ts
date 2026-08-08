export type PromptLang = "en" | "ru";

export interface Card {
  id: number;
  english: string;
  translation: string;
  context: string | null;
  cluster: string | null;
  overview: string | null;
  overview_status: "idle" | "generating" | "ready" | "failed" | "skipped" | "pending";
  state: string;
  due: string;
  bucket?: string | null;
  /** EN face already marked Выучил — only RU prompts remain in the feed. */
  learned_en?: boolean;
  /** Random front language for this session appearance — client-side only. */
  prompt_lang?: PromptLang;
}

export interface Stats {
  swipes_today: number;
  best_combo_today?: number;
}

export interface DailySwipeStat {
  date: string;
  count: number;
}

export interface DailyStats {
  days: DailySwipeStat[];
  total: number;
}

export interface VocabularyItem {
  id: number;
  english: string;
  translation: string;
  cluster: string | null;
  state: string;
  known_count: number;
  total_count: number;
  success_rate: number | null;
  lapses: number;
}

export interface VocabularyStats {
  total_words: number;
  with_stats: number;
  without_stats: number;
  items: VocabularyItem[];
}

export interface MatchdayDayResult {
  date: string;
  total: number;
  known: number;
  accuracy: number;
  completed: boolean;
}

export interface MatchdayMvpWord {
  card_id: number;
  english: string;
  delta_accuracy: number;
  today_accuracy: number;
  previous_accuracy: number;
}

export interface MatchdayStats {
  date: string;
  target_reviews: number;
  target_accuracy: number;
  today_total: number;
  today_known: number;
  today_accuracy: number;
  today_completed: boolean;
  today_result: "win" | "draw" | "loss" | null;
  unbeaten_run: number;
  form_last5: MatchdayDayResult[];
  xp_total: number;
  level: number;
  xp_in_level: number;
  xp_to_next_level: number;
  season_progress: number;
  season_name: string;
  mvp_word: MatchdayMvpWord | null;
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

export type SnoozeDays = 2 | 4 | 7;

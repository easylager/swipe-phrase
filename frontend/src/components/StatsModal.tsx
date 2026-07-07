"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DailyStats, VocabularyStats } from "@/types/card";

interface StatsModalProps {
  onClose: () => void;
}

type StatsTab = "activity" | "vocabulary";

const DAY_LABELS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

function formatDayLabel(dateIso: string, isToday: boolean): string {
  if (isToday) return "Сег";
  const date = new Date(`${dateIso}T12:00:00`);
  return DAY_LABELS[date.getDay()];
}

function formatFullDate(dateIso: string): string {
  const date = new Date(`${dateIso}T12:00:00`);
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function successTone(rate: number | null): string {
  if (rate === null) return "text-zinc-500";
  if (rate >= 80) return "text-emerald-300";
  if (rate >= 50) return "text-amber-200";
  return "text-red-300";
}

function VocabularyRow({ item }: { item: VocabularyStats["items"][number] }) {
  const hasStats = item.total_count > 0;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-3.5 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-white">{item.english}</p>
          {item.cluster && (
            <span className="shrink-0 rounded-full bg-blue-600/20 px-2 py-0.5 text-[10px] font-semibold text-blue-100">
              {item.cluster}
            </span>
          )}
        </div>
        <p className="truncate text-xs text-zinc-500">{item.translation}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`text-sm font-black tabular-nums ${successTone(item.success_rate)}`}>
          {item.known_count} / {item.total_count}
        </p>
        <p className="text-[10px] font-medium text-zinc-600">
          {hasStats ? `${item.success_rate}% знал` : "нет данных"}
        </p>
      </div>
    </div>
  );
}

export function StatsModal({ onClose }: StatsModalProps) {
  const [tab, setTab] = useState<StatsTab>("activity");
  const [daily, setDaily] = useState<DailyStats | null>(null);
  const [vocabulary, setVocabulary] = useState<VocabularyStats | null>(null);
  const [loadingDaily, setLoadingDaily] = useState(true);
  const [loadingVocabulary, setLoadingVocabulary] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([api.getDailyStats(14), api.getVocabularyStats()])
      .then(([dailyStats, vocabularyStats]) => {
        if (cancelled) return;
        setDaily(dailyStats);
        setVocabulary(vocabularyStats);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Не удалось загрузить статистику");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingDaily(false);
          setLoadingVocabulary(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const todayIso = new Date().toISOString().slice(0, 10);
  const maxCount = Math.max(...(daily?.days.map((d) => d.count) ?? [0]), 1);
  const loading = tab === "activity" ? loadingDaily : loadingVocabulary;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="glass-panel flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-[2rem] p-6 shadow-2xl sm:max-h-[85dvh] sm:rounded-[2rem]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-blue-200/80">
              Статистика
            </p>
            <p className="mt-1 text-xl font-black tracking-tight text-white">
              {tab === "activity" ? "Активность" : "Словарь"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tap-scale flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-sm text-zinc-300 hover:bg-white/[0.1]"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 flex gap-2 rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-1">
          <button
            type="button"
            onClick={() => setTab("activity")}
            className={`tap-scale flex-1 rounded-[1rem] py-2.5 text-sm font-semibold ${
              tab === "activity" ? "bg-white text-zinc-950" : "text-zinc-400 hover:text-white"
            }`}
          >
            График
          </button>
          <button
            type="button"
            onClick={() => setTab("vocabulary")}
            className={`tap-scale flex-1 rounded-[1rem] py-2.5 text-sm font-semibold ${
              tab === "vocabulary" ? "bg-white text-zinc-950" : "text-zinc-400 hover:text-white"
            }`}
          >
            Словарь
          </button>
        </div>

        {loading && (
          <div className="flex flex-1 items-center justify-center py-16">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-300 border-t-transparent" />
          </div>
        )}

        {error && !loading && (
          <p className="py-8 text-center text-sm text-red-400">{error}</p>
        )}

        {!loading && !error && tab === "activity" && daily && (
          <div className="space-y-4 overflow-y-auto">
            <p className="text-sm text-zinc-500">
              {daily.total} за 14 дней · сегодня{" "}
              <span className="font-medium text-zinc-300">
                {daily.days[daily.days.length - 1]?.count ?? 0}
              </span>
            </p>
            <div className="flex h-40 items-end gap-1.5 sm:gap-2">
              {daily.days.map((day) => {
                const isToday = day.date === todayIso;
                const heightPct = day.count === 0 ? 4 : Math.max(12, (day.count / maxCount) * 100);

                return (
                  <div
                    key={day.date}
                    className="group flex min-w-0 flex-1 flex-col items-center gap-2"
                    title={`${formatFullDate(day.date)}: ${day.count}`}
                  >
                    <span
                      className={`text-[10px] tabular-nums ${isToday ? "font-semibold text-blue-200" : "text-zinc-600"}`}
                    >
                      {day.count > 0 ? day.count : ""}
                    </span>
                    <div className="flex h-28 w-full items-end">
                      <div
                        className={`w-full rounded-t-md transition-all ${
                          isToday
                            ? "bg-gradient-to-t from-blue-800 to-red-500 shadow-lg shadow-blue-900/35"
                            : day.count > 0
                              ? "bg-gradient-to-t from-zinc-600 to-zinc-400"
                              : "bg-zinc-800/80"
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-medium ${isToday ? "text-blue-200" : "text-zinc-500"}`}
                    >
                      {formatDayLabel(day.date, isToday)}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-center text-xs text-zinc-600">
              Каждый свайп или ответ на карточке = 1 в статистике
            </p>
          </div>
        )}

        {!loading && !error && tab === "vocabulary" && vocabulary && (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                Всего слов
              </p>
              <p className="mt-1 text-3xl font-black tabular-nums text-white">
                {vocabulary.total_words}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {vocabulary.with_stats} с историей · {vocabulary.without_stats} без показов
              </p>
            </div>

            <p className="px-1 text-xs text-zinc-600">
              Сверху — слова, которые знаешь хуже всего. Снизу — ещё не было в ленте.
            </p>

            <div className="rounded-[1.2rem] border border-blue-300/20 bg-blue-700/10 px-3.5 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-100/90">
                Weakest XI
              </p>
              <p className="mt-1 text-xs text-zinc-300">
                Твои 11 самых слабых фраз на сегодня. Прокачай их в следующей сессии.
              </p>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pb-1">
              {vocabulary.items.length === 0 ? (
                <p className="py-10 text-center text-sm text-zinc-500">
                  Пока нет фраз — добавь первую во вкладке «Добавить»
                </p>
              ) : (
                vocabulary.items.map((item) => <VocabularyRow key={item.id} item={item} />)
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function StatsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tap-scale flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-zinc-300 hover:bg-white/10 hover:text-white"
      aria-label="Статистика"
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 19V9M12 19V5M19 19v-7" strokeLinecap="round" />
      </svg>
    </button>
  );
}

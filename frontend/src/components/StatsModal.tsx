"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DailyStats } from "@/types/card";

interface StatsModalProps {
  onClose: () => void;
}

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

export function StatsModal({ onClose }: StatsModalProps) {
  const [data, setData] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    api
      .getDailyStats(14)
      .then((stats) => {
        if (!cancelled) setData(stats);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Не удалось загрузить статистику");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const todayIso = new Date().toISOString().slice(0, 10);
  const maxCount = Math.max(...(data?.days.map((d) => d.count) ?? [0]), 1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-violet-400">
              Статистика
            </p>
            <p className="mt-1 text-lg font-semibold text-white">Свайпы по дням</p>
            {data && (
              <p className="mt-1 text-sm text-zinc-500">
                {data.total} за 14 дней · сегодня{" "}
                <span className="font-medium text-zinc-300">
                  {data.days[data.days.length - 1]?.count ?? 0}
                </span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 px-3 py-1 text-sm text-zinc-300 hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
          </div>
        )}

        {error && <p className="py-8 text-center text-sm text-red-400">{error}</p>}

        {data && !loading && (
          <div className="space-y-4">
            <div className="flex h-40 items-end gap-1.5 sm:gap-2">
              {data.days.map((day) => {
                const isToday = day.date === todayIso;
                const heightPct = day.count === 0 ? 4 : Math.max(12, (day.count / maxCount) * 100);

                return (
                  <div
                    key={day.date}
                    className="group flex min-w-0 flex-1 flex-col items-center gap-2"
                    title={`${formatFullDate(day.date)}: ${day.count}`}
                  >
                    <span
                      className={`text-[10px] tabular-nums ${isToday ? "font-semibold text-violet-300" : "text-zinc-600"}`}
                    >
                      {day.count > 0 ? day.count : ""}
                    </span>
                    <div className="flex h-28 w-full items-end">
                      <div
                        className={`w-full rounded-t-md transition-all ${
                          isToday
                            ? "bg-gradient-to-t from-violet-600 to-violet-400 shadow-lg shadow-violet-500/20"
                            : day.count > 0
                              ? "bg-gradient-to-t from-zinc-600 to-zinc-400"
                              : "bg-zinc-800/80"
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-medium ${isToday ? "text-violet-300" : "text-zinc-500"}`}
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
      </div>
    </div>
  );
}

export function StatsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-base text-zinc-300 transition hover:bg-white/10 hover:text-white"
      aria-label="Статистика"
    >
      📊
    </button>
  );
}

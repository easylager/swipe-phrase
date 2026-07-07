"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { PlayerCard } from "@/components/PlayerCard";
import type { SquadCollection, SquadPlayer } from "@/types/collection";

interface SquadCollectionSheetProps {
  onClose: () => void;
}

type Filter = "all" | "wc2026" | "unlocked" | "locked";

function FilterChip({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tap-scale rounded-full px-3 py-1.5 text-xs font-semibold ${
        active
          ? "bg-white text-zinc-950"
          : "border border-white/10 bg-white/[0.05] text-zinc-400 hover:text-white"
      }`}
    >
      {label}
      <span className="ml-1 tabular-nums opacity-70">{count}</span>
    </button>
  );
}

export function SquadButton({ onClick, unlocked, total }: { onClick: () => void; unlocked: number; total: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tap-scale flex h-10 items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.06] px-3 text-zinc-300 hover:bg-white/10 hover:text-white"
      aria-label="Сборная"
      title="Сборная England"
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3 4 7v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V7l-8-4Z" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-xs font-black tabular-nums">
        {unlocked}/{total}
      </span>
    </button>
  );
}

export function SquadCollectionSheet({ onClose }: SquadCollectionSheetProps) {
  const [data, setData] = useState<SquadCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<SquadPlayer | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getSquadCollection()
      .then((collection) => {
        if (!cancelled) setData(collection);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Ошибка загрузки");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (filter === "wc2026") return data.players.filter((p) => p.era === "current");
    if (filter === "unlocked") return data.players.filter((p) => p.unlocked);
    if (filter === "locked") return data.players.filter((p) => !p.unlocked);
    return data.players;
  }, [data, filter]);

  const lockedCount = data ? data.total - data.unlocked_count : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="glass-panel flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-[2rem] shadow-2xl sm:max-h-[88dvh] sm:rounded-[2rem]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-white/[0.06] p-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-blue-200/80">
                England Squad
              </p>
              <p className="mt-1 text-xl font-black text-white">Коллекция игроков</p>
              {data && (
                <p className="mt-1 text-sm text-zinc-400">
                  ЧМ 2026:{" "}
                  <span className="font-bold text-white">
                    {data.wc2026_unlocked}/{data.wc2026_total}
                  </span>
                  {data.unlocked_count > data.wc2026_unlocked && (
                    <span className="text-zinc-500">
                      {" "}
                      · легенды {data.unlocked_count - data.wc2026_unlocked}
                    </span>
                  )}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="tap-scale flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-zinc-300"
              aria-label="Закрыть"
            >
              ✕
            </button>
          </div>

          {data?.next_unlock && (
            <div className="mt-4 rounded-2xl border border-blue-500/20 bg-blue-950/30 px-3.5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200/70">
                Следующий игрок
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {data.next_unlock.name}{" "}
                <span className="font-normal text-zinc-400">— {data.next_unlock.unlock_hint}</span>
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-red-500"
                    style={{ width: `${data.next_unlock.progress}%` }}
                  />
                </div>
                <span className="shrink-0 text-[10px] font-bold tabular-nums text-zinc-400">
                  {data.next_unlock.current}/{data.next_unlock.target}
                </span>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <FilterChip label="Все" active={filter === "all"} count={data?.total ?? 0} onClick={() => setFilter("all")} />
            <FilterChip
              label="ЧМ 2026"
              active={filter === "wc2026"}
              count={data?.wc2026_total ?? 26}
              onClick={() => setFilter("wc2026")}
            />
            <FilterChip
              label="В составе"
              active={filter === "unlocked"}
              count={data?.unlocked_count ?? 0}
              onClick={() => setFilter("unlocked")}
            />
            <FilterChip
              label="Скаутинг"
              active={filter === "locked"}
              count={lockedCount}
              onClick={() => setFilter("locked")}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-3">
          {loading && (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-300 border-t-transparent" />
            </div>
          )}
          {error && <p className="py-8 text-center text-sm text-red-300">{error}</p>}
          {!loading && !error && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
              {filtered.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  compact
                  onClick={() => setSelected(player)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-6 backdrop-blur-md"
          onClick={() => setSelected(null)}
        >
          <div className="w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
            <PlayerCard player={selected} />
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="tap-scale mt-4 w-full rounded-2xl bg-white py-3 text-sm font-black text-zinc-950"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

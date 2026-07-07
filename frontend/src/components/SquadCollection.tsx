"use client";

/** @deprecated Album temporarily disabled — not imported from app shell. */
import { useEffect, useMemo, useState } from "react";
import { ERA_THEMES } from "@/components/panini/albumTheme";
import { PaniniCard } from "@/components/panini/PaniniCard";
import { api } from "@/lib/api";
import type { SquadCollection, SquadPlayer } from "@/types/collection";

interface SquadCollectionSheetProps {
  onClose: () => void;
}

type Filter = "all" | "wc2026" | "legends" | "golden" | "unlocked" | "locked";

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
      className={`tap-scale shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
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

function AlbumProgress({ collected, total }: { collected: number; total: number }) {
  const pct = total > 0 ? Math.round((collected / total) * 100) : 0;
  return (
    <div className="panini-album-cover rounded-2xl border border-white/10 p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/80">
            Panini Album
          </p>
          <p className="text-sm font-black text-white">
            {collected} / {total} наклеек
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-lg font-black text-white">
          {pct}%
        </div>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/30">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#0b1f5e] via-white to-[#cf1020]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function AlbumSection({
  title,
  subtitle,
  themeClass,
  players,
  onSelect,
}: {
  title: string;
  subtitle: string;
  themeClass: string;
  players: SquadPlayer[];
  onSelect: (p: SquadPlayer) => void;
}) {
  if (players.length === 0) return null;
  const unlocked = players.filter((p) => p.unlocked).length;

  return (
    <section className="mb-6">
      <div className={`mb-3 rounded-xl bg-gradient-to-r ${themeClass} px-3 py-2.5`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wide text-white">{title}</h3>
            <p className="text-[10px] font-medium text-white/60">{subtitle}</p>
          </div>
          <span className="rounded-lg bg-black/20 px-2 py-1 text-xs font-black tabular-nums text-white">
            {unlocked}/{players.length}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
        {players.map((player) => (
          <PaniniCard key={player.id} player={player} size="album" onClick={() => onSelect(player)} />
        ))}
      </div>
    </section>
  );
}

export function SquadButton({
  onClick,
  unlocked,
  total,
}: {
  onClick: () => void;
  unlocked: number;
  total: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tap-scale flex h-10 items-center gap-1.5 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-3 text-amber-100 hover:bg-amber-500/20"
      aria-label="Альбом Panini"
      title="Альбом Panini — England Squad"
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 7h8M8 11h8M8 15h5" strokeLinecap="round" />
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
    switch (filter) {
      case "wc2026":
        return data.players.filter((p) => p.era === "current");
      case "legends":
        return data.players.filter((p) => p.era === "legend");
      case "golden":
        return data.players.filter((p) => p.era === "golden");
      case "unlocked":
        return data.players.filter((p) => p.unlocked);
      case "locked":
        return data.players.filter((p) => !p.unlocked);
      default:
        return data.players;
    }
  }, [data, filter]);

  const wcPlayers = filtered.filter((p) => p.era === "current");
  const legendPlayers = filtered.filter((p) => p.era === "legend");
  const goldenPlayers = filtered.filter((p) => p.era === "golden");
  const showSections = filter === "all";
  const lockedCount = data ? data.total - data.unlocked_count : 0;

  return (
    <div
      className="panini-album-backdrop fixed inset-0 z-50 flex flex-col bg-[#0a0a0c]"
      onClick={onClose}
    >
      <div className="flex h-full flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Album header */}
        <header className="shrink-0 border-b border-white/[0.06] px-4 pb-3 pt-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-amber-200/70">
                Three Lions · Panini
              </p>
              <h2 className="text-xl font-black text-white">Альбом England</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="tap-scale flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-zinc-300"
              aria-label="Закрыть"
            >
              ✕
            </button>
          </div>

          {data && (
            <div className="mt-3">
              <AlbumProgress collected={data.unlocked_count} total={data.total} />
            </div>
          )}

          {data?.next_unlock && (
            <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-950/20 px-3.5 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200/70">
                Следующая наклейка
              </p>
              <p className="mt-0.5 text-sm font-semibold text-white">
                {data.next_unlock.name}{" "}
                <span className="font-normal text-zinc-400">— {data.next_unlock.unlock_hint}</span>
              </p>
            </div>
          )}

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <FilterChip label="Альбом" active={filter === "all"} count={data?.total ?? 0} onClick={() => setFilter("all")} />
            <FilterChip label="ЧМ 2026" active={filter === "wc2026"} count={data?.wc2026_total ?? 26} onClick={() => setFilter("wc2026")} />
            <FilterChip label="Legends" active={filter === "legends"} count={data?.players.filter((p) => p.era === "legend").length ?? 0} onClick={() => setFilter("legends")} />
            <FilterChip label="Golden" active={filter === "golden"} count={data?.players.filter((p) => p.era === "golden").length ?? 0} onClick={() => setFilter("golden")} />
            <FilterChip label="Есть" active={filter === "unlocked"} count={data?.unlocked_count ?? 0} onClick={() => setFilter("unlocked")} />
            <FilterChip label="Нет" active={filter === "locked"} count={lockedCount} onClick={() => setFilter("locked")} />
          </div>
        </header>

        {/* Album pages */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-8 pt-4">
          {loading && (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />
            </div>
          )}
          {error && <p className="py-8 text-center text-sm text-red-300">{error}</p>}

          {!loading && !error && showSections && (
            <>
              <AlbumSection
                title={ERA_THEMES.current.label}
                subtitle={ERA_THEMES.current.subtitle}
                themeClass={ERA_THEMES.current.headerGradient}
                players={wcPlayers}
                onSelect={setSelected}
              />
              <AlbumSection
                title={ERA_THEMES.legend.label}
                subtitle={ERA_THEMES.legend.subtitle}
                themeClass={ERA_THEMES.legend.headerGradient}
                players={legendPlayers}
                onSelect={setSelected}
              />
              <AlbumSection
                title={ERA_THEMES.golden.label}
                subtitle={ERA_THEMES.golden.subtitle}
                themeClass={ERA_THEMES.golden.headerGradient}
                players={goldenPlayers}
                onSelect={setSelected}
              />
            </>
          )}

          {!loading && !error && !showSections && (
            <div className="grid grid-cols-3 gap-2">
              {filtered.map((player) => (
                <PaniniCard key={player.id} player={player} size="album" onClick={() => setSelected(player)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 px-8 backdrop-blur-md"
          onClick={() => setSelected(null)}
        >
          <div className="w-full max-w-[240px]" onClick={(e) => e.stopPropagation()}>
            <PaniniCard player={selected} size="detail" />
            {!selected.unlocked && (
              <p className="mt-3 text-center text-xs text-zinc-400">{selected.unlock_hint}</p>
            )}
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

"use client";

import type { SquadPlayer } from "@/types/collection";

const POSITION_LABEL: Record<string, string> = {
  GK: "Вратарь",
  CB: "Защитник",
  RB: "Правый защитник",
  LB: "Левый защитник",
  CDM: "Опорник",
  CM: "Полузащитник",
  AM: "Атакующий",
  RW: "Правый вингер",
  LW: "Левый вингер",
  RM: "Правый полузащитник",
  ST: "Нападающий",
};

const RARITY_STYLES: Record<
  SquadPlayer["rarity"],
  { border: string; glow: string; badge: string; label: string }
> = {
  common: {
    border: "border-white/20",
    glow: "shadow-white/5",
    badge: "bg-white/10 text-zinc-200",
    label: "Squad",
  },
  rare: {
    border: "border-blue-400/40",
    glow: "shadow-blue-500/20",
    badge: "bg-blue-600/25 text-blue-100",
    label: "Rare",
  },
  icon: {
    border: "border-red-400/50",
    glow: "shadow-red-500/25",
    badge: "bg-gradient-to-r from-red-600/40 to-blue-700/40 text-white",
    label: "Icon",
  },
};

const ERA_LABEL: Record<SquadPlayer["era"], string> = {
  current: "ЧМ 2026",
  golden: "Golden Gen",
  legend: "Legend",
};

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

interface PlayerCardProps {
  player: SquadPlayer;
  compact?: boolean;
  onClick?: () => void;
}

export function PlayerCard({ player, compact = false, onClick }: PlayerCardProps) {
  const style = RARITY_STYLES[player.rarity];
  const locked = !player.unlocked;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`player-card tap-scale group relative w-full overflow-hidden rounded-[1.35rem] border text-left ${
        style.border
      } ${style.glow} shadow-xl ${compact ? "aspect-[3/4]" : "aspect-[2/3]"}`}
    >
      <div
        className={`absolute inset-0 ${
          locked
            ? "bg-gradient-to-br from-zinc-900 via-zinc-950 to-black"
            : player.era === "legend"
              ? "bg-gradient-to-br from-[#0b1f5e] via-[#1a1040] to-[#cf1020]/80"
              : player.era === "golden"
                ? "bg-gradient-to-br from-amber-900/80 via-[#0b1f5e] to-[#cf1020]/60"
                : "bg-gradient-to-br from-[#0b1f5e] via-[#122a7a] to-[#cf1020]/70"
        }`}
      />

      {!locked && (
        <>
          <div className="pointer-events-none absolute -right-6 -top-4 text-[7rem] font-black leading-none text-white/[0.06]">
            {player.number}
          </div>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(255,255,255,0.14),transparent_55%)]" />
        </>
      )}

      {locked && (
        <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.03)_0,rgba(255,255,255,0.03)_2px,transparent_2px,transparent_10px)]" />
      )}

      <div className="relative flex h-full flex-col p-3.5">
        <div className="flex items-start justify-between gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${style.badge}`}>
            {style.label}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
            {ERA_LABEL[player.era]}
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center py-2">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full border-2 ${
              locked
                ? "border-white/10 bg-white/[0.04] text-zinc-600"
                : "border-white/25 bg-white/10 text-2xl font-black text-white backdrop-blur-sm"
            }`}
          >
            {locked ? "?" : initials(player.name)}
          </div>

          <p className={`mt-3 text-center text-lg font-black tracking-tight ${locked ? "text-zinc-500" : "text-white"}`}>
            {locked ? "???" : player.name}
          </p>
          <p className="mt-0.5 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
            {POSITION_LABEL[player.position] ?? player.position}
            {!locked && (
              <span className="ml-1.5 tabular-nums text-white/70">#{player.number}</span>
            )}
          </p>
        </div>

        <div className="mt-auto space-y-2">
          {locked ? (
            <>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-red-500 transition-all"
                  style={{ width: `${player.progress}%` }}
                />
              </div>
              <p className="line-clamp-2 text-[10px] leading-snug text-zinc-500">
                {player.unlock_hint}
              </p>
              <p className="text-[10px] font-bold tabular-nums text-zinc-400">
                {player.current} / {player.target}
              </p>
            </>
          ) : (
            <p className="line-clamp-2 text-[11px] italic leading-snug text-white/75">
              {player.moment}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

interface PlayerCardHeroProps {
  player: SquadPlayer;
}

export function PlayerCardHero({ player }: PlayerCardHeroProps) {
  const style = RARITY_STYLES[player.rarity];

  return (
    <div
      className={`player-card relative mx-auto aspect-[2/3] w-full max-w-[240px] overflow-hidden rounded-[1.75rem] border-2 ${style.border} ${style.glow} shadow-2xl`}
    >
      <div
        className={`absolute inset-0 ${
          player.era === "legend"
            ? "bg-gradient-to-br from-[#0b1f5e] via-[#1a1040] to-[#cf1020]"
            : "bg-gradient-to-br from-[#0b1f5e] via-[#122a7a] to-[#cf1020]/80"
        }`}
      />
      <div className="pointer-events-none absolute -right-4 -top-2 text-[9rem] font-black leading-none text-white/[0.08]">
        {player.number}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(255,255,255,0.18),transparent_55%)]" />

      <div className="relative flex h-full flex-col p-5">
        <div className="flex items-center justify-between">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${style.badge}`}>
            New signing
          </span>
          <span className="text-xs font-bold text-white/50">{ERA_LABEL[player.era]}</span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-white/30 bg-white/10 text-4xl font-black text-white backdrop-blur-md">
            {initials(player.name)}
          </div>
          <p className="mt-4 text-2xl font-black text-white">{player.name}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
            {player.full_name}
          </p>
          <p className="mt-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
            {POSITION_LABEL[player.position] ?? player.position} · #{player.number}
          </p>
        </div>

        <p className="text-center text-sm italic text-white/80">{player.moment}</p>
      </div>
    </div>
  );
}

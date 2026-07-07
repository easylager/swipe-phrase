"use client";

import { ERA_THEMES, RARITY_FOIL } from "@/components/panini/albumTheme";
import { PlayerPortrait } from "@/components/panini/PlayerPortrait";
import type { SquadPlayer } from "@/types/collection";

const POSITION_LABEL: Record<string, string> = {
  GK: "GOALKEEPER",
  CB: "DEFENDER",
  RB: "DEFENDER",
  LB: "DEFENDER",
  CDM: "MIDFIELDER",
  CM: "MIDFIELDER",
  AM: "MIDFIELDER",
  RW: "FORWARD",
  LW: "FORWARD",
  RM: "MIDFIELDER",
  ST: "FORWARD",
};

interface PaniniCardProps {
  player: SquadPlayer;
  size?: "album" | "detail" | "hero";
  onClick?: () => void;
}

export function PaniniCard({ player, size = "album", onClick }: PaniniCardProps) {
  const theme = ERA_THEMES[player.era];
  const foil = RARITY_FOIL[player.rarity];
  const locked = !player.unlocked;
  const isInteractive = Boolean(onClick);

  const sizeClasses = {
    album: "aspect-[2/2.85] rounded-xl",
    detail: "aspect-[2/2.85] rounded-2xl max-w-[220px]",
    hero: "aspect-[2/2.85] rounded-[1.25rem] max-w-[260px]",
  }[size];

  const Wrapper = isInteractive ? "button" : "div";

  return (
    <Wrapper
      type={isInteractive ? "button" : undefined}
      onClick={onClick}
      className={`panini-sticker ${foil} ${theme.foilClass} group relative w-full overflow-hidden text-left ${sizeClasses} ${
        isInteractive ? "tap-scale cursor-pointer" : ""
      } ${locked ? "panini-sticker-locked" : ""}`}
    >
      {/* Outer foil frame */}
      <div className="absolute inset-0 rounded-[inherit] border-2 border-white/20" />
      <div className="absolute inset-[3px] rounded-[inherit] border border-black/20" />

      {/* Card body */}
      <div className="relative flex h-full flex-col bg-[#f4f4f5]">
        {/* Header strip — Panini style */}
        <div className={`relative shrink-0 bg-gradient-to-r ${theme.headerGradient} px-2 py-1.5`}>
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              <ThreeLionsBadge small />
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/95">
                England
              </span>
            </div>
            <span className="rounded bg-white/15 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider text-white">
              {theme.stamp}
            </span>
          </div>
          <p className="mt-0.5 text-[6px] font-semibold uppercase tracking-[0.14em] text-white/60">
            Phrase Feed Official
          </p>
        </div>

        {/* Portrait window */}
        <div className="relative mx-1.5 mt-1.5 flex-1 overflow-hidden rounded-lg border-2 border-[#0b1f5e]/20 bg-gradient-to-b from-[#dbeafe] to-[#93c5fd]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(11,31,94,0.15),transparent_60%)]" />
          <PlayerPortrait
            playerId={player.id}
            position={player.position}
            number={player.number}
            unlocked={!locked}
            className="h-full w-full object-contain p-1"
          />
          {locked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/55 backdrop-blur-[2px]">
              <span className="text-3xl font-black text-white/25">?</span>
              <span className="mt-1 text-[8px] font-bold uppercase tracking-widest text-white/40">
                Locked
              </span>
            </div>
          )}
          {/* Number badge */}
          <div className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#0b1f5e] shadow-md">
            <span className="text-[11px] font-black text-white">{player.number}</span>
          </div>
        </div>

        {/* Name plate */}
        <div className="mx-1.5 mb-1 mt-1 shrink-0 rounded-md border border-zinc-300 bg-white px-2 py-1.5 shadow-sm">
          <p
            className={`truncate text-center text-[11px] font-black uppercase tracking-wide ${
              locked ? "text-zinc-400" : "text-[#0b1f5e]"
            }`}
          >
            {locked ? "???" : player.name}
          </p>
          <p className="truncate text-center text-[7px] font-bold uppercase tracking-[0.12em] text-zinc-500">
            {POSITION_LABEL[player.position] ?? player.position}
          </p>
        </div>

        {/* Footer — moment or progress */}
        <div
          className="shrink-0 px-2 py-1.5"
          style={{ background: locked ? "#27272a" : theme.accent }}
        >
          {locked ? (
            <div className="space-y-1">
              <div className="h-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-white/70"
                  style={{ width: `${player.progress}%` }}
                />
              </div>
              <p className="line-clamp-2 text-[6px] leading-tight text-zinc-400">
                {player.unlock_hint}
              </p>
            </div>
          ) : (
            <p className="line-clamp-2 text-center text-[7px] font-medium italic leading-tight text-white">
              {player.moment}
            </p>
          )}
        </div>
      </div>
    </Wrapper>
  );
}

export function PaniniCardHero({ player }: { player: SquadPlayer }) {
  return (
    <div className="mx-auto w-full max-w-[280px]">
      <PaniniCard player={player} size="hero" />
    </div>
  );
}

function ThreeLionsBadge({ small }: { small?: boolean }) {
  const s = small ? 14 : 18;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="11" fill="white" fillOpacity="0.2" />
      <path
        d="M12 4c-2 2-4 3-6 3 0 3 1 5 3 7-1 1-1 3 0 4 2-1 4-1 6 0 2-1 4-1 6 0 1-1 1-3 0-4 2-2 3-4 3-7-2 0-4-1-6-3Z"
        fill="white"
        fillOpacity="0.85"
      />
    </svg>
  );
}

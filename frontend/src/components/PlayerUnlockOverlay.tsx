"use client";

import { PlayerCardHero } from "@/components/PlayerCard";
import type { SquadPlayer } from "@/types/collection";

interface PlayerUnlockOverlayProps {
  players: SquadPlayer[];
  onDismiss: () => void;
}

export function PlayerUnlockOverlay({ players, onDismiss }: PlayerUnlockOverlayProps) {
  if (players.length === 0) return null;

  const primary = players[0];
  const extra = players.length - 1;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/80 px-4 pb-6 backdrop-blur-md sm:items-center"
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-900/95 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.28em] text-red-300/90">
          New signing
        </p>
        <p className="mt-1 text-center text-xl font-black text-white">
          {extra > 0 ? `${players.length} новых игроков!` : "Игрок в составе!"}
        </p>

        <div className="my-5">
          <PlayerCardHero player={primary} />
        </div>

        {extra > 0 && (
          <p className="mb-4 text-center text-sm text-zinc-400">
            Также: {players.slice(1).map((p) => p.name).join(", ")}
          </p>
        )}

        <p className="text-center text-xs text-zinc-500">{primary.unlock_hint}</p>

        <button
          type="button"
          onClick={onDismiss}
          className="tap-scale mt-5 w-full rounded-2xl bg-white py-3.5 text-sm font-black text-zinc-950"
        >
          В состав!
        </button>
      </div>
    </div>
  );
}

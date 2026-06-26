"use client";

import { useState } from "react";
import type { Card } from "@/types/card";
import { formatRoast, shareRoast } from "@/lib/shareRoast";

interface RoastSheetProps {
  english: string;
  translation: string;
  roast: string;
  status: Card["roast_status"];
  onClose: () => void;
  onRegenerate?: () => void;
}

function RoastShareCard({
  english,
  translation,
  roast,
}: {
  english: string;
  translation: string;
  roast: string;
}) {
  return (
    <div className="relative aspect-[9/16] w-full max-w-[220px] overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-br from-violet-950 via-zinc-950 to-indigo-950 p-4 shadow-lg shadow-orange-500/10">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl" />
      <p className="text-[10px] font-semibold uppercase tracking-widest text-orange-400">🔥 Roast</p>
      <p className="mt-3 text-lg font-bold leading-tight text-white">&ldquo;{english}&rdquo;</p>
      <p className="mt-1 text-xs text-violet-300/80">→ {translation}</p>
      <p className="mt-4 text-xs leading-relaxed text-zinc-200">{formatRoast(roast)}</p>
      <p className="absolute bottom-4 left-4 text-[10px] text-zinc-500">Phrase Feed</p>
    </div>
  );
}

export function RoastSheet({
  english,
  translation,
  roast,
  status,
  onClose,
  onRegenerate,
}: RoastSheetProps) {
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  const handleShare = async () => {
    if (!roast) return;
    setShareMsg(null);
    try {
      const result = await shareRoast(english, translation, roast);
      setShareMsg(result === "shared" ? "Отправлено!" : "Скопировано в буфер");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setShareMsg("Не удалось поделиться");
    }
  };

  const isLoading = status === "generating" || status === "idle" || status === "pending";

  return (
    <div
      className="absolute inset-0 z-20 flex items-end bg-black/70 backdrop-blur-sm"
      data-no-swipe
      onClick={onClose}
    >
      <div
        className="max-h-[85%] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-orange-400">🔥 Roast</p>
            <p className="mt-1 text-lg font-semibold text-white">{english}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 px-3 py-1 text-sm text-zinc-300 hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-3 py-8 text-zinc-400">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
            <span className="text-sm">Готовим roast...</span>
          </div>
        ) : status === "failed" ? (
          <div className="py-6 text-center">
            <p className="text-sm text-zinc-400">Roast не вышел — бывает</p>
            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="mt-4 rounded-xl bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500"
              >
                Ещё раз
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex justify-center py-2">
              <RoastShareCard english={english} translation={translation} roast={roast} />
            </div>
            <p className="mt-4 whitespace-pre-wrap text-center text-sm leading-relaxed text-zinc-300">
              {formatRoast(roast)}
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => void handleShare()}
                className="w-full rounded-2xl bg-gradient-to-r from-orange-600 to-rose-600 py-3 text-sm font-semibold text-white transition hover:from-orange-500 hover:to-rose-500"
              >
                Зашерить roast
              </button>
              {onRegenerate && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  className="w-full rounded-2xl bg-white/5 py-2.5 text-sm text-zinc-400 transition hover:bg-white/10 hover:text-white"
                >
                  Новый roast
                </button>
              )}
              {shareMsg && <p className="text-center text-xs text-zinc-500">{shareMsg}</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface RoastButtonProps {
  status: Card["roast_status"];
  onClick: () => void;
}

export function RoastButton({ status, onClick }: RoastButtonProps) {
  if (status === "skipped") return null;

  const labels: Record<string, string> = {
    idle: "Roast",
    pending: "Roast",
    generating: "Roast…",
    ready: "Roast",
    failed: "Roast ✕",
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
        status === "ready"
          ? "bg-orange-500/15 text-orange-300 hover:bg-orange-500/25"
          : status === "failed"
            ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
            : "bg-white/5 text-zinc-500"
      }`}
    >
      {status === "generating" && (
        <span className="inline-block h-3 w-3 animate-spin rounded-full border border-zinc-500 border-t-transparent" />
      )}
      {status !== "generating" && <span>🔥</span>}
      {labels[status] ?? "Roast"}
    </button>
  );
}

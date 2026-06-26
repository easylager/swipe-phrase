"use client";

import type { Card } from "@/types/card";

interface OverviewSheetProps {
  english: string;
  overview: string;
  status: Card["overview_status"];
  onClose: () => void;
  onRegenerate?: () => void;
}

/** Normalize overview text — strip markdown, keep readable plain text. */
function formatOverview(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^\* /gm, "— ")
    .replace(/^\t\* /gm, "— ")
    .replace(/^#+\s*/gm, "")
    .trim();
}

export function OverviewSheet({
  english,
  overview,
  status,
  onClose,
  onRegenerate,
}: OverviewSheetProps) {
  return (
    <div
      className="absolute inset-0 z-20 flex items-end bg-black/70 backdrop-blur-sm"
      data-no-swipe
      onClick={onClose}
    >
      <div
        className="max-h-[70%] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-violet-400">Обзор</p>
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

        {status === "generating" || status === "idle" || status === "pending" ? (
          <div className="flex items-center gap-3 py-8 text-zinc-400">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
            <span className="text-sm">Нейросеть пишет обзор...</span>
          </div>
        ) : status === "failed" ? (
          <div className="py-6 text-center">
            <p className="text-sm text-zinc-400">Не удалось сгенерировать обзор</p>
            <p className="mt-2 text-xs text-zinc-500">
              Проверь GROQ_API_KEY на сервере или попробуй ещё раз
            </p>
            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
              >
                Попробовать снова
              </button>
            )}
          </div>
        ) : (
          <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
            {formatOverview(overview)}
          </div>
        )}
      </div>
    </div>
  );
}

interface OverviewButtonProps {
  status: Card["overview_status"];
  onClick: () => void;
}

export function OverviewButton({ status, onClick }: OverviewButtonProps) {
  if (status === "skipped") return null;

  const labels: Record<string, string> = {
    idle: "Обзор",
    pending: "Обзор",
    generating: "Обзор…",
    ready: "Обзор",
    failed: "Обзор ✕",
  };

  const isLoading = status === "generating";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
        status === "ready"
          ? "bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
          : status === "failed"
            ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
            : "bg-white/5 text-zinc-500"
      }`}
    >
      {isLoading && (
        <span className="inline-block h-3 w-3 animate-spin rounded-full border border-zinc-500 border-t-transparent" />
      )}
      {labels[status] ?? "Обзор"}
    </button>
  );
}

"use client";

import { SNOOZE_OPTIONS, type SnoozeDays } from "@/lib/snooze";

interface SnoozeSheetProps {
  english: string;
  onSelect: (days: SnoozeDays) => void;
  onClose: () => void;
}

export function SnoozeSheet({ english, onSelect, onClose }: SnoozeSheetProps) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm"
      data-no-swipe
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-3xl border border-white/10 bg-zinc-900 px-5 pb-8 pt-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-sky-400">Отложить</p>
            <p className="mt-1 text-base font-semibold text-white">{english}</p>
            <p className="mt-1 text-xs text-zinc-500">Не будет в ленте до выбранного срока</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 px-3 py-1 text-sm text-zinc-300 hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {SNOOZE_OPTIONS.map((option) => (
            <button
              key={option.days}
              type="button"
              onClick={() => onSelect(option.days)}
              className="rounded-2xl border border-sky-500/20 bg-sky-500/10 py-4 text-sm font-semibold text-sky-200 transition hover:border-sky-400/40 hover:bg-sky-500/20 active:scale-[0.98]"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

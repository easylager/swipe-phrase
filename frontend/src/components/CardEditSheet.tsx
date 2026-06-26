"use client";

import { FormEvent, useState } from "react";
import type { Card } from "@/types/card";

interface CardEditSheetProps {
  card: Card;
  onClose: () => void;
  onSave: (payload: {
    english: string;
    translation: string;
    context?: string;
    cluster?: string;
  }) => Promise<void>;
}

export function CardEditSheet({ card, onClose, onSave }: CardEditSheetProps) {
  const [english, setEnglish] = useState(card.english);
  const [translation, setTranslation] = useState(card.translation);
  const [context, setContext] = useState(card.context ?? "");
  const [cluster, setCluster] = useState(card.cluster ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 outline-none transition focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/30";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSave({
        english,
        translation,
        context: context || undefined,
        cluster: cluster || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="absolute inset-0 z-40 flex items-end bg-black/70 backdrop-blur-sm"
      data-no-swipe
      onClick={onClose}
    >
      <form
        className="max-h-[85%] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-violet-400">
              Редактировать
            </p>
            <p className="mt-1 text-sm text-zinc-400">Исправь опечатку — обзор обновится сам</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 px-3 py-1 text-sm text-zinc-300 hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-300">English</span>
            <input
              className={inputClass}
              value={english}
              onChange={(e) => setEnglish(e.target.value)}
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-300">Перевод</span>
            <input
              className={inputClass}
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-300">Контекст</span>
            <textarea
              className={`${inputClass} min-h-[72px] resize-none`}
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-300">Кластер</span>
            <input
              className={inputClass}
              value={cluster}
              onChange={(e) => setCluster(e.target.value)}
            />
          </label>
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-2xl bg-violet-600 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
        >
          {loading ? "Сохраняю..." : "Сохранить"}
        </button>
      </form>
    </div>
  );
}

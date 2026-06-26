"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";

interface CardCreatorProps {
  onCreated?: () => void;
}

export function CardCreator({ onCreated }: CardCreatorProps) {
  const [english, setEnglish] = useState("");
  const [translation, setTranslation] = useState("");
  const [context, setContext] = useState("");
  const [cluster, setCluster] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await api.createCard({
        english,
        translation,
        context: context || undefined,
        cluster: cluster || undefined,
      });
      setEnglish("");
      setTranslation("");
      setContext("");
      setCluster("");
      setSuccess(true);
      onCreated?.();
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 outline-none transition focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/30";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 py-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Новая фраза</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Добавь слово или фразу, которую поймал в жизни
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-300">English *</span>
        <input
          className={inputClass}
          value={english}
          onChange={(e) => setEnglish(e.target.value)}
          placeholder="The meeting ran over"
          required
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-300">Перевод *</span>
        <input
          className={inputClass}
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          placeholder="Встреча затянулась"
          required
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-300">Контекст</span>
        <textarea
          className={`${inputClass} min-h-[80px] resize-none`}
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Sorry I'm late — the meeting ran over."
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-300">Кластер / тема</span>
        <input
          className={inputClass}
          value={cluster}
          onChange={(e) => setCluster(e.target.value)}
          placeholder="Work, Travel, Daily..."
        />
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-emerald-400">Карточка добавлена ✓</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-2xl bg-violet-600 py-4 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
      >
        {loading ? "Сохраняю..." : "Добавить карточку"}
      </button>
    </form>
  );
}

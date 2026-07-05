"use client";

import { FormEvent, useId, useRef, useState } from "react";
import { api } from "@/lib/api";

const TAGS = ["Сленг", "Работа", "Быт", "Медиа"] as const;

interface CardCreatorProps {
  onCreated?: () => void;
}

/** Mobile-friendly attrs — avoids iOS password/card autofill bar above keyboard. */
const phraseInputProps = {
  autoComplete: "off" as const,
  "data-1p-ignore": true,
  "data-lpignore": "true",
  "data-form-type": "other",
};

export function CardCreator({ onCreated }: CardCreatorProps) {
  const formId = useId();
  const translationRef = useRef<HTMLInputElement>(null);

  const [english, setEnglish] = useState("");
  const [translation, setTranslation] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = english.trim().length > 0 && translation.trim().length > 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await api.createCard({
        english: english.trim(),
        translation: translation.trim(),
        context: note.trim() || undefined,
        cluster: tag ?? undefined,
      });
      setEnglish("");
      setTranslation("");
      setNote("");
      setTag(null);
      setShowNote(false);
      setSuccess(true);
      onCreated?.();
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    "w-full rounded-[1.35rem] border border-white/10 bg-white/[0.055] px-4 py-4 text-[17px] text-white placeholder-zinc-600 outline-none shadow-inner shadow-black/10 transition focus:border-violet-300/40 focus:bg-white/[0.08] focus:ring-4 focus:ring-violet-500/10";

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      autoComplete="off"
      className="flex min-h-full flex-col px-4 pb-5 pt-2"
    >
      <div className="glass-panel mb-4 rounded-[1.8rem] px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-300/80">
          Быстрый захват
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">Новая фраза</h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-400">
          Поймал в жизни — сохрани сейчас, повторишь в ленте позже.
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <div className="glass-panel rounded-[1.8rem] p-4">
          <label
            htmlFor={`${formId}-en`}
            className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500"
          >
            English phrase
          </label>
          <input
            id={`${formId}-en`}
            name="phrase-english"
            type="text"
            lang="en"
            inputMode="text"
            enterKeyHint="next"
            autoCapitalize="sentences"
            autoCorrect="on"
            spellCheck
            className={fieldClass}
            value={english}
            onChange={(e) => setEnglish(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                translationRef.current?.focus();
              }
            }}
            placeholder="lowkey, gotcha, it hits different..."
            {...phraseInputProps}
          />
        </div>

        <div className="glass-panel rounded-[1.8rem] p-4">
          <label
            htmlFor={`${formId}-ru`}
            className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500"
          >
            Перевод
          </label>
          <input
            ref={translationRef}
            id={`${formId}-ru`}
            name="phrase-translation"
            type="text"
            lang="ru"
            inputMode="text"
            enterKeyHint="done"
            autoCapitalize="sentences"
            autoCorrect="on"
            spellCheck
            className={fieldClass}
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            placeholder="коротко по-русски"
            {...phraseInputProps}
          />
        </div>

        <div className="glass-panel rounded-[1.8rem] p-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
            Контекст <span className="normal-case tracking-normal text-zinc-600">(опционально)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTag((prev) => (prev === t ? null : t))}
                className={`tap-scale rounded-full border px-3.5 py-2 text-sm font-semibold ${
                  tag === t
                    ? "border-violet-300/30 bg-white text-zinc-950 shadow-lg shadow-violet-500/10"
                    : "border-white/10 bg-white/[0.045] text-zinc-400 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {!showNote ? (
          <button
            type="button"
            onClick={() => setShowNote(true)}
            className="tap-scale mx-1 self-start rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-zinc-400 hover:bg-white/[0.08] hover:text-white"
          >
            + Добавить заметку
          </button>
        ) : (
          <div className="glass-panel rounded-[1.8rem] p-4">
            <label
              htmlFor={`${formId}-note`}
              className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500"
            >
              Где услышал
            </label>
            <input
              id={`${formId}-note`}
              name="phrase-note"
              type="text"
              inputMode="text"
              enterKeyHint="done"
              autoCapitalize="sentences"
              className={fieldClass}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="созвон, подкаст, сериал..."
              {...phraseInputProps}
            />
          </div>
        )}
      </div>

      <div className="mt-4 shrink-0 space-y-2">
        {error && (
          <p className="rounded-2xl border border-red-300/15 bg-red-500/10 px-4 py-3 text-center text-sm text-red-200">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-2xl border border-emerald-300/15 bg-emerald-500/10 px-4 py-3 text-center text-sm font-semibold text-emerald-200">
            Сохранено в ленту
          </p>
        )}
        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="tap-scale w-full rounded-[1.45rem] bg-white py-4 text-base font-black text-zinc-950 shadow-xl shadow-violet-500/15 disabled:opacity-40"
        >
          {loading ? "Сохраняю..." : "Добавить в ленту"}
        </button>
      </div>
    </form>
  );
}

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
    "w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-4 text-[17px] text-white placeholder-zinc-600 outline-none transition focus:border-violet-500/60";

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      autoComplete="off"
      className="flex min-h-full flex-col px-4 pb-6 pt-5"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-white">Новая фраза</h2>
        <p className="mt-1 text-sm text-zinc-500">Поймал в жизни — закинь в ленту</p>
      </div>

      <div className="flex flex-1 flex-col gap-4">
        <div>
          <label htmlFor={`${formId}-en`} className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
            English
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
            placeholder="lowkey"
            {...phraseInputProps}
          />
        </div>

        <div>
          <label htmlFor={`${formId}-ru`} className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
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
            placeholder="типа, ну ты понял"
            {...phraseInputProps}
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Тег <span className="normal-case text-zinc-600">(необязательно)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTag((prev) => (prev === t ? null : t))}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${
                  tag === t
                    ? "bg-violet-600 text-white"
                    : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
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
            className="self-start text-sm text-zinc-500 transition hover:text-zinc-300"
          >
            + Где услышал?
          </button>
        ) : (
          <div>
            <label htmlFor={`${formId}-note`} className="mb-2 block text-xs font-medium text-zinc-500">
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

      <div className="mt-6 shrink-0 space-y-2">
        {error && <p className="text-center text-sm text-red-400">{error}</p>}
        {success && (
          <p className="text-center text-sm font-medium text-emerald-400">В ленте ✓</p>
        )}
        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="w-full rounded-2xl bg-violet-600 py-4 text-base font-semibold text-white transition active:scale-[0.98] disabled:opacity-40"
        >
          {loading ? "Сохраняю..." : "В ленту"}
        </button>
      </div>
    </form>
  );
}

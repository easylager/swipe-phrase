"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import type { Card } from "@/types/card";
import { api } from "@/lib/api";
import { useSpeech } from "@/hooks/useSpeech";
import { OverviewButton, OverviewSheet } from "@/components/OverviewSheet";
import { CardEditSheet } from "@/components/CardEditSheet";
import { getCardFaces } from "@/lib/cardPrompt";
import { contextTextClass, phraseTextClass } from "@/lib/phraseTypography";

interface FlashCardProps {
  card: Card;
  isFlipped: boolean;
  onReview?: (rating: "again" | "graduated") => void;
  onRequestOverview?: () => Promise<void>;
  onRegenerateOverview?: () => void;
  onCardUpdate?: (card: Card) => void;
  onEdit?: (payload: {
    english: string;
    translation: string;
    context?: string;
    cluster?: string;
  }) => Promise<void>;
  disabled?: boolean;
  preview?: boolean;
}

const faceStyle = {
  backfaceVisibility: "hidden" as const,
  WebkitBackfaceVisibility: "hidden" as const,
};

function PhraseScrollArea({
  lang,
  children,
}: {
  lang: "en" | "ru";
  children: ReactNode;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        lang={lang}
        className="flex h-full w-full flex-col items-center justify-center gap-3 px-5 py-6 sm:px-8"
      >
        {children}
      </div>
    </div>
  );
}

function LangBadge({ lang }: { lang: "en" | "ru" }) {
  return (
    <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
      {lang === "en" ? "EN" : "RU"}
    </span>
  );
}

export function FlashCard({
  card,
  isFlipped,
  onReview,
  onRequestOverview,
  onRegenerateOverview,
  onCardUpdate,
  onEdit,
  disabled,
  preview = false,
}: FlashCardProps) {
  const { speak } = useSpeech();
  const [showOverview, setShowOverview] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const faces = getCardFaces(card);
  const frontClass = phraseTextClass(faces.frontText);
  const backClass = phraseTextClass(faces.backText);

  const handleOpenOverview = async () => {
    setShowOverview(true);
    if (card.overview_status === "ready" && card.overview) return;
    if (card.overview_status === "generating") return;
    await onRequestOverview?.();
  };

  // Poll only while the overview sheet is open and LLM is working.
  useEffect(() => {
    if (!showOverview || card.overview_status !== "generating" || !onCardUpdate) return;

    const timer = setInterval(async () => {
      try {
        const updated = await api.getCard(card.id);
        onCardUpdate(updated);
      } catch {
        /* ignore */
      }
    }, 2000);

    return () => clearInterval(timer);
  }, [showOverview, card.overview_status, card.id, onCardUpdate]);

  return (
    <div className="pointer-events-none relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/40 perspective-[1200px]">
      {!preview && showOverview && (
        <div className="pointer-events-auto absolute inset-0 z-40">
          <OverviewSheet
            english={card.english}
            overview={card.overview ?? ""}
            status={card.overview_status}
            onClose={() => setShowOverview(false)}
            onRegenerate={onRegenerateOverview}
          />
        </div>
      )}

      {!preview && showEdit && onEdit && (
        <div className="pointer-events-auto absolute inset-0 z-40">
          <CardEditSheet card={card} onClose={() => setShowEdit(false)} onSave={onEdit} />
        </div>
      )}

      <div className="pointer-events-none relative min-h-0 flex-1">
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.45, type: "spring", stiffness: 120, damping: 18 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front — random EN or RU */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800"
            style={faceStyle}
          >
            <PhraseScrollArea lang={faces.frontLang}>
              <div className="flex shrink-0 items-center gap-2">
                <LangBadge lang={faces.frontLang} />
                {card.cluster && (
                  <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-300">
                    {card.cluster}
                  </span>
                )}
              </div>
              <p
                className={`w-full max-w-full text-balance text-center font-semibold break-words text-white ${frontClass}`}
              >
                {faces.frontText}
              </p>
              {!preview && (
                <p className="shrink-0 text-xs text-zinc-500">Не знаешь? Тап — ответ</p>
              )}
            </PhraseScrollArea>
          </div>

          {/* Back — opposite language */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-zinc-900 to-zinc-900"
            style={{ ...faceStyle, transform: "rotateY(180deg)" }}
          >
            <PhraseScrollArea lang={faces.backLang}>
              <div className="flex shrink-0 items-center gap-2">
                <LangBadge lang={faces.backLang} />
                <p className="text-xs font-medium uppercase tracking-wider text-indigo-300/60">
                  {faces.backLabel}
                </p>
              </div>
              <p
                className={`w-full max-w-full text-balance text-center font-bold break-words text-white ${backClass}`}
              >
                {faces.backText}
              </p>
              {card.context && (
                <p
                  className={`w-full max-w-full text-balance text-center break-words text-indigo-200/70 ${contextTextClass(card.context)}`}
                >
                  {card.context}
                </p>
              )}
            </PhraseScrollArea>
          </div>
        </motion.div>
      </div>

      {!preview && (
        <div
          data-no-swipe
          className="pointer-events-auto relative z-30 shrink-0 border-t border-white/10 bg-zinc-950/95 px-4 py-3 backdrop-blur-md"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <OverviewButton
                status={card.overview_status}
                onClick={() => void handleOpenOverview()}
              />
              {onEdit && (
                <button
                  type="button"
                  onClick={() => setShowEdit(true)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-base transition hover:bg-white/20"
                  aria-label="Редактировать"
                >
                  ✎
                </button>
              )}
              <button
                type="button"
                onClick={() => speak(card.english)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg transition hover:bg-white/20"
                aria-label="Прослушать"
              >
                🔊
              </button>
            </div>

            {isFlipped && onReview && (
              <div className="flex w-full gap-3">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onReview("again")}
                  className="flex-1 rounded-2xl bg-red-500/20 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/30 disabled:opacity-50"
                >
                  Не знал
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onReview("graduated")}
                  className="flex-1 rounded-2xl border border-violet-400/30 bg-violet-500/10 py-3 text-sm font-semibold text-violet-300 transition hover:bg-violet-500/20 disabled:opacity-50"
                >
                  ✓ Выучил
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

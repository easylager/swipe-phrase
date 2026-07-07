"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import type { Card } from "@/types/card";
import { api } from "@/lib/api";
import { useSpeech } from "@/hooks/useSpeech";
import { OverviewButton, OverviewSheet } from "@/components/OverviewSheet";
import { SnoozeSheet } from "@/components/SnoozeSheet";
import { CardEditSheet } from "@/components/CardEditSheet";
import type { SnoozeDays } from "@/types/card";
import { getCardFaces } from "@/lib/cardPrompt";
import { contextTextClass, phraseTextClass } from "@/lib/phraseTypography";

interface FlashCardProps {
  card: Card;
  isFlipped: boolean;
  onReview?: (rating: "again" | "graduated") => void;
  onRequestOverview?: () => Promise<void>;
  onRegenerateOverview?: () => void;
  onSnooze?: (days: SnoozeDays) => void;
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
        className="flex h-full w-full flex-col items-center justify-center gap-4 px-6 py-7 sm:px-8"
      >
        {children}
      </div>
    </div>
  );
}

function LangBadge({ lang }: { lang: "en" | "ru" }) {
  return (
    <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-300 shadow-inner shadow-white/5">
      {lang === "en" ? "EN" : "RU"}
    </span>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="tap-scale flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1] hover:text-white"
    >
      {children}
    </button>
  );
}

export function FlashCard({
  card,
  isFlipped,
  onReview,
  onRequestOverview,
  onRegenerateOverview,
  onSnooze,
  onCardUpdate,
  onEdit,
  disabled,
  preview = false,
}: FlashCardProps) {
  const { speak } = useSpeech();
  const [showOverview, setShowOverview] = useState(false);
  const [showSnooze, setShowSnooze] = useState(false);
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
    <div className="premium-card pointer-events-none relative flex h-full w-full flex-col overflow-hidden rounded-[2.1rem] perspective-[1200px]">
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-blue-700/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-8 h-44 w-44 rounded-full bg-sky-500/10 blur-3xl" />

      {!preview && showSnooze && onSnooze && (
        <div className="pointer-events-auto absolute inset-0 z-40">
          <SnoozeSheet
            english={card.english}
            onClose={() => setShowSnooze(false)}
            onSelect={(days) => {
              setShowSnooze(false);
              onSnooze(days);
            }}
          />
        </div>
      )}

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
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(11,31,94,0.34),transparent_22rem)]" style={faceStyle}>
            <PhraseScrollArea lang={faces.frontLang}>
              <div className="flex shrink-0 items-center gap-2">
                <LangBadge lang={faces.frontLang} />
                {card.cluster && (
                  <span className="rounded-full border border-blue-300/15 bg-blue-500/15 px-3 py-1.5 text-xs font-semibold text-blue-100">
                    {card.cluster}
                  </span>
                )}
              </div>
              <p
                className={`w-full max-w-full text-balance text-center font-semibold tracking-tight break-words text-white drop-shadow-sm ${frontClass}`}
              >
                {faces.frontText}
              </p>
              {!preview && (
                <p className="shrink-0 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-medium text-zinc-400">
                  Тапни, чтобы увидеть ответ
                </p>
              )}
            </PhraseScrollArea>
          </div>

          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(207,16,32,0.24),transparent_22rem)]"
            style={{ ...faceStyle, transform: "rotateY(180deg)" }}
          >
            <PhraseScrollArea lang={faces.backLang}>
              <div className="flex shrink-0 items-center gap-2">
                <LangBadge lang={faces.backLang} />
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-100/70">
                  {faces.backLabel}
                </p>
              </div>
              <p
                className={`w-full max-w-full text-balance text-center font-bold tracking-tight break-words text-white ${backClass}`}
              >
                {faces.backText}
              </p>
              {card.context && (
                <p
                  className={`max-w-[92%] rounded-3xl border border-white/10 bg-white/[0.05] px-4 py-3 text-balance text-center break-words text-zinc-200/85 ${contextTextClass(card.context)}`}
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
          className="pointer-events-auto relative z-30 shrink-0 border-t border-white/10 bg-black/28 px-4 py-4 backdrop-blur-2xl"
        >
          <div className="flex flex-col items-center gap-3.5">
            <div className="flex w-full items-center justify-center gap-2">
              <OverviewButton
                status={card.overview_status}
                onClick={() => void handleOpenOverview()}
              />
              {onSnooze && (
                <IconButton label="Отложить" onClick={() => setShowSnooze(true)}>
                  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M21 12a9 9 0 1 1-3-6.7" strokeLinecap="round" />
                  </svg>
                </IconButton>
              )}
              {onEdit && (
                <IconButton label="Редактировать" onClick={() => setShowEdit(true)}>
                  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m14 5 5 5-9 9H5v-5l9-9Z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </IconButton>
              )}
              <IconButton label="Озвучить" onClick={() => speak(card.english)}>
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 10v4h4l5 4V6l-5 4H4Z" strokeLinejoin="round" />
                  <path d="M17 9.5a4 4 0 0 1 0 5" strokeLinecap="round" />
                </svg>
              </IconButton>
            </div>

            {isFlipped && onReview && (
              <div className="flex w-full gap-2.5">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onReview("graduated")}
                  className="tap-scale flex-[1.35] rounded-2xl bg-white py-3.5 text-sm font-black text-zinc-950 shadow-lg shadow-blue-900/25 hover:bg-blue-50 disabled:opacity-50"
                >
                  Выучил
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onReview("again")}
                  className="tap-scale flex-1 rounded-2xl border border-red-300/15 bg-red-500/12 py-3.5 text-sm font-bold text-red-200 hover:bg-red-500/18 disabled:opacity-50"
                >
                  Не знал
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { Card, UsageChallenge } from "@/types/card";
import { useSpeech } from "@/hooks/useSpeech";
import { contextTextClass, phraseTextClass } from "@/lib/phraseTypography";

interface UsageChallengeCardProps {
  card: Card;
  challenge: UsageChallenge;
  isFlipped: boolean;
  onRespond?: (outcome: "applied" | "again") => void;
  disabled?: boolean;
  preview?: boolean;
}

const faceStyle = {
  backfaceVisibility: "hidden" as const,
  WebkitBackfaceVisibility: "hidden" as const,
};

function FaceCenter({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-6 py-7 sm:px-8">
        {children}
      </div>
    </div>
  );
}

export function UsageChallengeCard({
  card,
  challenge,
  isFlipped,
  onRespond,
  disabled = false,
  preview = false,
}: UsageChallengeCardProps) {
  const { speak } = useSpeech();
  const phrase = challenge.target_phrase || card.english;
  const phraseClass = phraseTextClass(phrase);

  return (
    <div className="premium-card pointer-events-none relative flex h-full w-full flex-col overflow-hidden rounded-[2.1rem] perspective-[1200px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.22),transparent_22rem),radial-gradient(circle_at_80%_100%,rgba(11,31,94,0.28),transparent_20rem)]" />

      <div className="pointer-events-none relative min-h-0 flex-1">
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.45, type: "spring", stiffness: 120, damping: 18 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front — life situation only */}
          <div className="absolute inset-0" style={faceStyle}>
            <FaceCenter>
              <span className="rounded-full bg-emerald-500/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
                Примени в жизни
              </span>
              {card.cluster && (
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-300">
                  {card.cluster}
                </span>
              )}
              <p className="w-full max-w-full text-balance text-center text-lg font-semibold leading-snug text-white sm:text-xl">
                {challenge.scenario}
              </p>
              {challenge.hint && (
                <p className="max-w-[92%] rounded-3xl border border-white/10 bg-white/[0.05] px-4 py-3 text-center text-sm text-zinc-400">
                  💡 {challenge.hint}
                </p>
              )}
              {!preview && (
                <p className="shrink-0 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-medium text-zinc-400">
                  Тапни, чтобы увидеть фразу
                </p>
              )}
            </FaceCenter>
          </div>

          {/* Back — phrase answer */}
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.2),transparent_22rem)]"
            style={{ ...faceStyle, transform: "rotateY(180deg)" }}
          >
            <FaceCenter>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-300">
                  EN
                </span>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200/70">
                  Фраза
                </p>
              </div>
              <p
                className={`w-full max-w-full text-balance text-center font-bold tracking-tight break-words text-white ${phraseClass}`}
              >
                {phrase}
              </p>
              <p
                className={`w-full max-w-full text-balance text-center break-words text-zinc-300 ${contextTextClass(card.translation)}`}
              >
                {card.translation}
              </p>
              {challenge.example_answer && (
                <p className="max-w-[92%] rounded-3xl border border-emerald-400/20 bg-emerald-950/30 px-4 py-3 text-balance text-center text-sm italic text-emerald-100/90">
                  «{challenge.example_answer}»
                </p>
              )}
            </FaceCenter>
          </div>
        </motion.div>
      </div>

      {!preview && (
        <div
          data-no-swipe
          className="pointer-events-auto relative z-30 shrink-0 border-t border-white/10 bg-black/28 px-4 py-4 backdrop-blur-2xl"
        >
          <div className="flex flex-col items-center gap-3.5">
            <button
              type="button"
              onClick={() => speak(phrase)}
              aria-label="Озвучить"
              className="tap-scale flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1] hover:text-white"
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 10v4h4l5 4V6l-5 4H4Z" strokeLinejoin="round" />
                <path d="M17 9.5a4 4 0 0 1 0 5" strokeLinecap="round" />
              </svg>
            </button>

            {isFlipped && onRespond && (
              <div className="flex w-full gap-2.5">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onRespond("applied")}
                  className="tap-scale flex-[1.35] rounded-2xl bg-emerald-500 py-3.5 text-sm font-black text-zinc-950 disabled:opacity-50"
                >
                  Сказал ✓
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onRespond("again")}
                  className="tap-scale flex-1 rounded-2xl border border-red-300/15 bg-red-500/12 py-3.5 text-sm font-bold text-red-200 disabled:opacity-50"
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

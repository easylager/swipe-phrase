"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Card } from "@/types/card";
import type { UsageChallenge } from "@/types/card";

interface UsageChallengeCardProps {
  card: Card;
  challenge: UsageChallenge;
  onRespond: (outcome: "applied" | "again") => void;
  disabled?: boolean;
}

export function UsageChallengeCard({
  card,
  challenge,
  onRespond,
  disabled = false,
}: UsageChallengeCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [didNotKnow, setDidNotKnow] = useState(false);

  const reveal = (unknown: boolean) => {
    setDidNotKnow(unknown);
    setRevealed(true);
  };

  return (
    <div className="premium-card pointer-events-auto relative flex h-full min-h-0 flex-col overflow-hidden rounded-[1.85rem]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.22),transparent_22rem),radial-gradient(circle_at_80%_100%,rgba(11,31,94,0.35),transparent_20rem)]" />

      <div className="relative shrink-0 border-b border-white/10 px-5 py-4">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
            Примени в жизни
          </span>
          {card.cluster && (
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-zinc-300">
              {card.cluster}
            </span>
          )}
        </div>
        <p className="mt-2 text-xs font-medium text-zinc-400">
          {!revealed
            ? "Прочитай ситуацию → попробуй ответить по-английски"
            : didNotKnow
              ? "Вот фраза, которая сюда подходит"
              : "Честно: получилось вставить фразу в ответ?"}
        </p>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col px-5 py-5">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden>
            🗣️
          </span>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300/80">
            Ситуация
          </p>
          <span className="ml-auto rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-bold tabular-nums text-zinc-500">
            {revealed ? "2/2" : "1/2"}
          </span>
        </div>

        <p className="mt-3 text-lg font-semibold leading-snug text-white">{challenge.scenario}</p>

        {challenge.hint && !revealed && (
          <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-400">
            💡 {challenge.hint}
          </p>
        )}

        <div className="mt-auto pt-6" data-no-swipe>
          {!revealed ? (
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  reveal(false);
                }}
                className="tap-scale w-full rounded-2xl bg-white py-3.5 text-sm font-black text-zinc-950 shadow-lg shadow-emerald-900/20 disabled:opacity-50"
              >
                Я ответил — проверить
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  reveal(true);
                }}
                className="tap-scale w-full rounded-2xl border border-white/15 bg-white/5 py-3.5 text-sm font-bold text-zinc-300 disabled:opacity-50"
              >
                Не знаю — показать фразу
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key="reveal"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="rounded-2xl border border-emerald-400/25 bg-emerald-950/30 px-4 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200/70">
                    Нужная фраза
                  </p>
                  <p className="mt-2 text-xl font-black text-white">{challenge.target_phrase}</p>
                  <p className="mt-1 text-sm text-zinc-400">{card.translation}</p>
                  {challenge.example_answer && (
                    <div className="mt-3 border-t border-white/10 pt-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                        Пример ответа
                      </p>
                      <p className="mt-1.5 text-sm italic leading-relaxed text-emerald-100/90">
                        «{challenge.example_answer}»
                      </p>
                    </div>
                  )}
                </div>

                {didNotKnow ? (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRespond("again");
                    }}
                    className="tap-scale w-full rounded-2xl border border-white/15 bg-white/10 py-3.5 text-sm font-black text-white disabled:opacity-50"
                  >
                    Понял — дальше
                  </button>
                ) : (
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRespond("applied");
                      }}
                      className="tap-scale flex-[1.35] rounded-2xl bg-emerald-500 py-3.5 text-sm font-black text-zinc-950 disabled:opacity-50"
                    >
                      Сказал ✓
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRespond("again");
                      }}
                      className="tap-scale flex-1 rounded-2xl border border-red-300/20 bg-red-500/12 py-3.5 text-sm font-bold text-red-200 disabled:opacity-50"
                    >
                      Не знал
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}

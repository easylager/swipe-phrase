"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { animate, motion } from "framer-motion";
import { api } from "@/lib/api";
import { buildFeedQueue, isCardItem } from "@/lib/feedQueue";
import type { Card, Stats } from "@/types/card";
import type { FeedItem } from "@/types/feed";
import { AdCard } from "@/components/AdCard";
import { ComboCounter } from "@/components/ComboCounter";
import { FlashCard } from "@/components/FlashCard";
import { SessionDigest } from "@/components/SessionDigest";
import { useCardSwipe } from "@/hooks/useCardSwipe";

export function SwipeFeed() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [graduatedAnim, setGraduatedAnim] = useState(false);
  const [combo, setCombo] = useState(0);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  const flipTimeRef = useRef<number | null>(null);
  const cardShownRef = useRef(0);
  const busyRef = useRef(false);
  const comboRef = useRef(0);
  const sessionMaxComboRef = useRef(0);

  const resetCombo = useCallback(() => {
    comboRef.current = 0;
    setCombo(0);
  }, []);

  const incrementCombo = useCallback(() => {
    comboRef.current += 1;
    sessionMaxComboRef.current = Math.max(sessionMaxComboRef.current, comboRef.current);
    setCombo(comboRef.current);
    return comboRef.current;
  }, []);

  const loadSession = useCallback(async (): Promise<Stats | null> => {
    setLoading(true);
    try {
      const [session, statsData] = await Promise.all([api.getSession(), api.getStats()]);
      setFeed(buildFeedQueue(session));
      setStats(statsData);
      setIndex(0);
      setIsFlipped(false);
      cardShownRef.current = Date.now();
      flipTimeRef.current = null;
      resetCombo();
      sessionMaxComboRef.current = 0;
      return statsData;
    } finally {
      setLoading(false);
    }
  }, [resetCombo]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!sessionNotice) return;
    const timer = setTimeout(() => setSessionNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [sessionNotice]);

  const updateCardInFeed = useCallback((updated: Card) => {
    setFeed((prev) =>
      prev.map((item) => {
        if (!isCardItem(item) || item.card.id !== updated.id) return item;
        return { ...item, card: { ...updated, prompt_lang: item.card.prompt_lang } };
      }),
    );
  }, []);

  const current = feed[index];
  const next = feed[index + 1];
  const currentCard = current && isCardItem(current) ? current.card : null;

  const getLatencies = () => {
    const now = Date.now();
    const flipLatency = flipTimeRef.current
      ? flipTimeRef.current - cardShownRef.current
      : undefined;
    const answerLatency = flipTimeRef.current ? now - flipTimeRef.current : undefined;
    return { flipLatency, answerLatency };
  };

  const finishSession = useCallback(async () => {
    const sessionBest = sessionMaxComboRef.current;
    const statsData = await loadSession();
    if (sessionBest > 0 && statsData) {
      const best = statsData.best_combo_today ?? sessionBest;
      setSessionNotice(`Лучшее комбо сегодня: 🔥 ${best}`);
    }
  }, [loadSession]);

  const goNext = useCallback(() => {
    setIsFlipped(false);
    flipTimeRef.current = null;
    cardShownRef.current = Date.now();

    if (index + 1 >= feed.length) {
      finishSession();
    } else {
      setIndex((i) => i + 1);
    }
  }, [index, feed.length, finishSession]);

  const bumpSwipes = useCallback((comboAfter?: number) => {
    setStats((s) => {
      if (!s) return s;
      const nextBest =
        comboAfter && comboAfter > (s.best_combo_today ?? 0)
          ? comboAfter
          : (s.best_combo_today ?? 0);
      return { swipes_today: s.swipes_today + 1, best_combo_today: nextBest };
    });
  }, []);

  const dismissAd = useCallback(() => {
    goNext();
  }, [goNext]);

  const swipeAwayAsKnown = useCallback(
    async (card: Card) => {
      const { flipLatency, answerLatency } = getLatencies();
      const comboAfter = incrementCombo();
      bumpSwipes(comboAfter);
      try {
        await api.submitReview(card.id, "good", flipLatency, answerLatency, comboAfter);
        const statsData = await api.getStats();
        setStats(statsData);
      } catch {
        /* ignore */
      }
      goNext();
    },
    [goNext, bumpSwipes, incrementCombo],
  );

  const handleFlip = useCallback(() => {
    if (!isFlipped) flipTimeRef.current = Date.now();
    setIsFlipped((f) => !f);
  }, [isFlipped]);

  const handleSwipeUp = useCallback(() => {
    if (!current || busyRef.current) return;

    if (current.kind === "ad") {
      dismissAd();
      return;
    }

    swipeAwayAsKnown(current.card);
  }, [current, dismissAd, swipeAwayAsKnown]);

  const { y, scale, opacity, handlers } = useCardSwipe({
    onSwipeUp: handleSwipeUp,
    onTap: handleFlip,
    disabled: busy,
  });

  const submitAndAdvance = useCallback(
    async (rating: "again" | "graduated") => {
      if (!currentCard || busyRef.current) return;
      busyRef.current = true;
      setBusy(true);

      const card = currentCard;
      const { flipLatency, answerLatency } = getLatencies();
      const comboAfter = rating === "graduated" ? incrementCombo() : null;

      if (rating === "again") {
        resetCombo();
      }

      try {
        await api.submitReview(
          card.id,
          rating,
          flipLatency,
          answerLatency,
          comboAfter ?? undefined,
        );
        bumpSwipes(comboAfter ?? undefined);
        const statsData = await api.getStats();
        setStats(statsData);

        if (rating === "graduated") {
          setGraduatedAnim(true);
          setTimeout(() => {
            setGraduatedAnim(false);
            goNext();
          }, 700);
        } else {
          await animate(y, -window.innerHeight * 0.85, { duration: 0.2, ease: "easeIn" });
          y.set(0);
          goNext();
        }
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [currentCard, goNext, y, bumpSwipes, incrementCombo, resetCombo],
  );

  const handleRequestOverview = async () => {
    if (!currentCard) return;
    try {
      const updated = await api.requestOverview(currentCard.id);
      updateCardInFeed(updated);
    } catch {
      /* handled in sheet */
    }
  };

  const handleRegenerateOverview = async () => {
    if (!currentCard) return;
    try {
      const updated = await api.regenerateOverview(currentCard.id);
      updateCardInFeed(updated);
    } catch {
      /* handled in sheet */
    }
  };

  const handleEditCard = async (payload: {
    english: string;
    translation: string;
    context?: string;
    cluster?: string;
  }) => {
    if (!currentCard) return;
    const updated = await api.updateCard(currentCard.id, payload);
    updateCardInFeed(updated);
  };

  const renderFeedItem = (item: FeedItem, flipped: boolean, preview = false) => {
    if (item.kind === "ad") {
      return <AdCard ad={item.ad} isFlipped={flipped} />;
    }

    return (
      <FlashCard
        card={item.card}
        isFlipped={flipped}
        onReview={preview ? undefined : submitAndAdvance}
        onRequestOverview={preview ? undefined : handleRequestOverview}
        onRegenerateOverview={preview ? undefined : handleRegenerateOverview}
        onCardUpdate={preview ? undefined : updateCardInFeed}
        onEdit={preview ? undefined : handleEditCard}
        disabled={busy}
        preview={preview}
      />
    );
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
      </div>
    );
  }

  if (!current) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-2xl font-semibold text-white">Нет карточек</p>
        <p className="text-zinc-400">Добавь первую фразу во вкладке «Добавить»</p>
      </div>
    );
  }

  const hintText =
    current.kind === "ad"
      ? "↑ свайп — пропустить · тап — подробности"
      : "↑ свайп — знал · тап — ответ";

  return (
    <div className="relative flex h-full flex-col overflow-hidden touch-none" {...handlers}>
      {stats && (
        <div className="pointer-events-none relative shrink-0">
          <SessionDigest stats={stats} sessionNotice={sessionNotice} />
          <ComboCounter combo={combo} />
        </div>
      )}

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="relative min-h-0 flex-1 px-3 pt-3">
          {next && (
            <div className="pointer-events-none absolute inset-0 z-0 scale-[0.94] opacity-30">
              {renderFeedItem(next, false, true)}
            </div>
          )}

          <motion.div
            key={current.id}
            className="pointer-events-none absolute inset-0 z-10 select-none"
            style={{ y, scale, opacity }}
          >
            {renderFeedItem(current, isFlipped)}
          </motion.div>
        </div>

        <p className="pointer-events-none shrink-0 px-4 pb-1 pt-2 text-center text-[11px] tracking-wide text-zinc-600/90">
          {hintText}
        </p>
      </div>

      {graduatedAnim && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/60"
        >
          <div className="rounded-3xl bg-violet-600/90 px-8 py-6 text-center shadow-2xl">
            <p className="text-4xl">🎉</p>
            <p className="mt-2 text-xl font-bold text-white">Выучил!</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

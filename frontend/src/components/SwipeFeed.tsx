"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { animate, motion } from "framer-motion";
import { api } from "@/lib/api";
import { buildFeedQueue } from "@/lib/feedQueue";
import { clearFeedProgress, getFeedProgress, saveFeedProgress } from "@/lib/feedProgress";
import type { Card, Stats } from "@/types/card";
import type { FeedItem } from "@/types/feed";
import { AdCard } from "@/components/AdCard";
import { FlashCard } from "@/components/FlashCard";
import { OfflineBanner } from "@/components/OfflineBanner";
import { SessionDigest } from "@/components/SessionDigest";
import { useCardSwipe } from "@/hooks/useCardSwipe";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { snoozeLabel, type SnoozeDays } from "@/lib/snooze";

const CARD_EXIT_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const CARD_EXIT_DURATION = 0.34;
const CARD_SNOOZE_DURATION = 0.3;

export function SwipeFeed() {
  const { isOnline, pendingCount } = useOfflineStatus();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [celebration, setCelebration] = useState<string | null>(null);
  const [combo, setCombo] = useState(0);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const flipTimeRef = useRef<number | null>(null);
  const cardShownRef = useRef(0);
  const busyRef = useRef(false);
  const comboRef = useRef(0);

  const resetCombo = useCallback(() => {
    comboRef.current = 0;
    setCombo(0);
  }, []);

  const incrementCombo = useCallback(() => {
    comboRef.current += 1;
    setCombo(comboRef.current);
    return comboRef.current;
  }, []);

  const loadSession = useCallback(async (): Promise<Stats | null> => {
    setLoading(true);
    clearFeedProgress();
    try {
      const [session, statsData] = await Promise.all([api.getSession(), api.getStats()]);
      setFeed(buildFeedQueue(session));
      setStats(statsData);
      setIndex(0);
      setIsFlipped(false);
      cardShownRef.current = Date.now();
      flipTimeRef.current = null;
      resetCombo();
      return statsData;
    } finally {
      setLoading(false);
    }
  }, [resetCombo]);

  useEffect(() => {
    const saved = getFeedProgress();
    if (saved) {
      setFeed(saved.feed);
      setIndex(saved.index);
      setCombo(saved.combo);
      comboRef.current = saved.combo;
      setIsFlipped(saved.isFlipped);
      setStats(saved.stats);
      setLoading(false);
      cardShownRef.current = Date.now();
      void api.getStats().then(setStats).catch(() => {});
      return;
    }
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (loading || feed.length === 0) return;
    saveFeedProgress({ feed, index, combo, isFlipped, stats });
  }, [feed, index, combo, isFlipped, stats, loading]);

  useEffect(() => {
    if (!actionNotice) return;
    const timer = setTimeout(() => setActionNotice(null), 2800);
    return () => clearTimeout(timer);
  }, [actionNotice]);

  const updateCardInFeed = useCallback((updated: Card) => {
    setFeed((prev) =>
      prev.map((item) => {
        if (item.kind === "ad" || item.card.id !== updated.id) return item;
        return { ...item, card: { ...updated, prompt_lang: item.card.prompt_lang } };
      }),
    );
  }, []);

  const current = feed[index];
  const currentCard = current && current.kind === "card" ? current.card : null;

  const getLatencies = () => {
    const now = Date.now();
    const flipLatency = flipTimeRef.current
      ? flipTimeRef.current - cardShownRef.current
      : undefined;
    const answerLatency = flipTimeRef.current ? now - flipTimeRef.current : undefined;
    return { flipLatency, answerLatency };
  };

  const finishSession = useCallback(async () => {
    await loadSession();
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

  const bumpSwipes = useCallback(() => {
    setStats((s) => (s ? { ...s, swipes_today: s.swipes_today + 1 } : s));
  }, []);

  const dismissAd = useCallback(() => {
    goNext();
  }, [goNext]);

  const swipeAwayAsKnown = useCallback(
    (card: Card) => {
      const { flipLatency, answerLatency } = getLatencies();
      const comboAfter = incrementCombo();
      bumpSwipes();
      goNext();

      void api
        .submitReview(card.id, "good", flipLatency, answerLatency, comboAfter)
        .then(() => api.getStats())
        .then(setStats)
        .catch(() => {});
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

  const animateCardExit = useCallback(async () => {
    await animate(y, -window.innerHeight, {
      duration: CARD_EXIT_DURATION,
      ease: CARD_EXIT_EASE,
    });
    goNext();
    y.set(0);
  }, [goNext, y]);

  const animateCardSnooze = useCallback(async () => {
    await animate(y, window.innerHeight * 0.65, {
      duration: CARD_SNOOZE_DURATION,
      ease: CARD_EXIT_EASE,
    });
    goNext();
    y.set(0);
  }, [goNext, y]);

  const handleSnooze = useCallback(
    async (days: SnoozeDays) => {
      if (!currentCard || busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      setActionNotice(`Отложено · ${snoozeLabel(days)}`);
      void api.snoozeCard(currentCard.id, days).catch(() => {});
      try {
        await animateCardSnooze();
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [currentCard, animateCardSnooze],
  );

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

      bumpSwipes();

      void api
        .submitReview(card.id, rating, flipLatency, answerLatency, comboAfter ?? undefined)
        .then(() => api.getStats())
        .then(setStats)
        .catch(() => {});

      try {
        if (rating === "graduated") {
          setCelebration("Выучил!");
          setTimeout(() => {
            setCelebration(null);
            goNext();
          }, 700);
        } else {
          await animateCardExit();
        }
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [currentCard, goNext, bumpSwipes, incrementCombo, resetCombo, animateCardExit],
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
        onSnooze={preview ? undefined : handleSnooze}
        onCardUpdate={preview ? undefined : updateCardInFeed}
        onEdit={preview ? undefined : handleEditCard}
        disabled={busy}
        preview={preview}
      />
    );
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-emerald-400/70 border-t-transparent" />
        <p className="text-center text-sm font-medium text-zinc-400">
          Собираем тренировку…
        </p>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="glass-panel rounded-[2rem] px-6 py-8">
          <p className="text-2xl font-black tracking-tight text-white">Лента пустая</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Добавь первую фразу, и Phrase Feed соберёт для тебя тренировку.
          </p>
        </div>
      </div>
    );
  }

  const hintText =
    current.kind === "ad"
      ? "Свайп вверх — пропустить · тап — детали"
      : "Свайп вверх — знаю · тап — ответ";

  return (
    <div className="relative flex h-full flex-col overflow-hidden touch-none" {...handlers}>
      <OfflineBanner isOnline={isOnline} pendingCount={pendingCount} />
      {actionNotice && (
        <div className="shrink-0 border-b border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-center text-xs font-medium text-emerald-200/90">
          {actionNotice}
        </div>
      )}
      {stats && (
        <div className="pointer-events-none shrink-0">
          <SessionDigest stats={stats} combo={combo} />
        </div>
      )}

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="relative min-h-0 flex-1 px-4 pt-2">
          <motion.div
            key={current.id}
            className="pointer-events-none absolute inset-0 z-10 select-none"
            style={{ y, scale, opacity }}
          >
            {renderFeedItem(current, isFlipped)}
          </motion.div>
        </div>

        <p className="pointer-events-none shrink-0 px-4 pb-2 pt-2 text-center text-[11px] font-semibold tracking-wide text-zinc-500/90">
          {hintText}
        </p>
      </div>

      {celebration && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/60"
        >
          <div className="rounded-3xl bg-blue-700/90 px-8 py-6 text-center shadow-2xl">
            <p className="text-4xl">🎉</p>
            <p className="mt-2 text-xl font-bold text-white">{celebration}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

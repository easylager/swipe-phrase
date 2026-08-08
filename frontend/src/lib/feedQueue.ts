import { withSessionPromptLang } from "@/lib/cardPrompt";
import { pickMockAd } from "@/lib/mockAds";
import type { Card, PromptLang } from "@/types/card";
import type { FeedItem } from "@/types/feed";

const AD_EVERY_N_CARDS = 5;

/** Interleave a mock ad after every N phrase cards. */
export function buildFeedQueue(cards: Card[]): FeedItem[] {
  const items: FeedItem[] = [];
  let adSlot = 0;

  cards.forEach((card, i) => {
    items.push({
      id: `card-${card.id}`,
      kind: "card",
      card: withSessionPromptLang(card),
    });

    if ((i + 1) % AD_EVERY_N_CARDS === 0) {
      const ad = pickMockAd(adSlot++);
      items.push({ id: `ad-${ad.id}-${i}`, kind: "ad", ad });
    }
  });

  return items;
}

/** Refresh card data from API without rebuilding ad slots. */
export function mergeFeedQueue(prev: FeedItem[], cards: Card[]): FeedItem[] {
  const byId = new Map(cards.map((c) => [c.id, c]));

  return prev.map((item) => {
    if (item.kind === "ad") return item;

    const fresh = byId.get(item.card.id);
    if (!fresh) return item;

    const promptLang = fresh.learned_en
      ? ("ru" as const)
      : (item.card.prompt_lang ?? fresh.prompt_lang);

    return {
      ...item,
      card: {
        ...fresh,
        prompt_lang: promptLang,
      },
    };
  });
}

export function isCardItem(item: FeedItem): item is FeedItem & { kind: "card"; card: Card } {
  return item.kind === "card";
}

/**
 * Remove a learned face from the feed.
 * - RU Выучил: drop the whole phrase
 * - EN Выучил: drop only English fronts (RU faces of the same card stay)
 */
export function removeLearnedFromFeed(
  feed: FeedItem[],
  index: number,
  cardId: number,
  lang: PromptLang,
): { feed: FeedItem[]; index: number } {
  let removedBefore = 0;

  const nextFeed = feed.filter((item, i) => {
    if (item.kind === "ad") return true;
    if (item.card.id !== cardId) return true;

    const shouldDrop =
      lang === "ru" || (item.card.prompt_lang ?? "en") === "en";

    if (!shouldDrop) return true;
    if (i < index) removedBefore += 1;
    return false;
  });

  return { feed: nextFeed, index: index - removedBefore };
}

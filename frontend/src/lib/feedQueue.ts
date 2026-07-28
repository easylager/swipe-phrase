import { withRandomPromptLang } from "@/lib/cardPrompt";
import { pickMockAd } from "@/lib/mockAds";
import type { Card } from "@/types/card";
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
      card: withRandomPromptLang(card),
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

    return {
      ...item,
      card: {
        ...fresh,
        prompt_lang: item.card.prompt_lang ?? fresh.prompt_lang,
      },
    };
  });
}

export function isCardItem(item: FeedItem): item is FeedItem & { kind: "card"; card: Card } {
  return item.kind === "card";
}

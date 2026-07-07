import { withRandomPromptLang } from "@/lib/cardPrompt";
import { pickMockAd } from "@/lib/mockAds";
import type { SessionItem } from "@/types/card";
import type { FeedItem } from "@/types/feed";

const AD_EVERY_N_CARDS = 5;

/** Build feed from session items, interleaving mock ads. */
export function buildFeedQueue(items: SessionItem[]): FeedItem[] {
  const queue: FeedItem[] = [];
  let adSlot = 0;
  let cardCount = 0;

  for (const item of items) {
    const card = withRandomPromptLang(item.card);
    if (item.kind === "usage_challenge" && item.challenge) {
      queue.push({
        id: `challenge-${item.challenge.id}`,
        kind: "usage_challenge",
        card,
        challenge: item.challenge,
      });
    } else {
      queue.push({
        id: `card-${card.id}`,
        kind: "card",
        card,
      });
    }
    cardCount += 1;

    if (cardCount % AD_EVERY_N_CARDS === 0) {
      const ad = pickMockAd(adSlot++);
      queue.push({ id: `ad-${ad.id}-${cardCount}`, kind: "ad", ad });
    }
  }

  return queue;
}

/** Refresh card data from API without rebuilding ad slots. */
export function mergeFeedQueue(prev: FeedItem[], items: SessionItem[]): FeedItem[] {
  const byCardId = new Map(items.map((i) => [i.card.id, i]));

  return prev.map((item) => {
    if (item.kind === "ad") return item;

    const fresh = byCardId.get(item.card.id);
    if (!fresh) return item;

    const card = {
      ...fresh.card,
      prompt_lang: item.card.prompt_lang ?? fresh.card.prompt_lang,
    };

    if (item.kind === "usage_challenge" && fresh.challenge) {
      return {
        ...item,
        card,
        challenge: fresh.challenge,
      };
    }

    return { ...item, card };
  });
}

export function isCardItem(item: FeedItem): item is FeedItem & { kind: "card"; card: import("@/types/card").Card } {
  return item.kind === "card";
}

export function isUsageChallengeItem(
  item: FeedItem,
): item is FeedItem & { kind: "usage_challenge"; challenge: import("@/types/card").UsageChallenge } {
  return item.kind === "usage_challenge";
}

import type { Card } from "@/types/card";
import type { UsageChallenge } from "@/types/card";

export interface MockAd {
  id: string;
  brand: string;
  emoji: string;
  headline: string;
  tagline: string;
  cta: string;
  accent: "violet" | "amber" | "cyan" | "rose" | "emerald";
  backTitle: string;
  backBullets: string[];
  backFooter: string;
}

export type FeedItem =
  | { id: string; kind: "card"; card: Card }
  | { id: string; kind: "usage_challenge"; card: Card; challenge: UsageChallenge }
  | { id: string; kind: "ad"; ad: MockAd };

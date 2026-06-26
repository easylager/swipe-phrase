import type { MockAd } from "@/types/feed";

export const MOCK_ADS: MockAd[] = [
  {
    id: "lucky-swipe-casino",
    brand: "LuckySwipe Casino",
    emoji: "🎰",
    headline: "Крути барабан. English can wait.",
    tagline: "Твой «double or nothing» начинается прямо сейчас",
    cta: "Забрать бонус 500%",
    accent: "amber",
    backTitle: "Условия «щедрого» бонуса",
    backBullets: [
      "Депозит от $10 — вывод от $10,000",
      "Wagering x47 на free spins",
      "Support отвечает «soon™»",
    ],
    backFooter: "18+. Азартные игры. Вымишленное казино. Деньги тоже вымышленные.",
  },
  {
    id: "royal-flush",
    brand: "Royal Flush Palace",
    emoji: "♠️",
    headline: "All in on vibes",
    tagline: "Blackjack, roulette & questionable life choices",
    cta: "Играть бесплатно*",
    accent: "rose",
    backTitle: "*Бесплатно — условно",
    backBullets: [
      "Первый спин — улыбка дилера",
      "Второй — «you're so lucky»",
      "Третий — «maybe take a break»",
    ],
    backFooter: "Gambling responsibly since never. Demo ad only.",
  },
  {
    id: "brainfuel",
    brand: "BrainFuel Energy",
    emoji: "⚡",
    headline: "Бодрость без sleep schedule",
    tagline: "Taste like battery acid. Works like chaos.",
    cta: "Заказать 24-pack",
    accent: "cyan",
    backTitle: "Nutrition facts",
    backBullets: [
      "300mg caffeine per can",
      "0% rem sleep guaranteed",
      "May cause confident English at 3am",
    ],
    backFooter: "Not a real product. Heart palpitations are.",
  },
  {
    id: "vibematch",
    brand: "VibeMatch",
    emoji: "💘",
    headline: "Find someone who gets your phrasal verbs",
    tagline: "Swipe right on «it's complicated»",
    cta: "Start matching",
    accent: "violet",
    backTitle: "Premium perks",
    backBullets: [
      "See who ghosted you first",
      "Unlimited «hey» without reply",
      "AI wingman: «touch base later»",
    ],
    backFooter: "Love is temporary. Subscriptions are forever.",
  },
  {
    id: "moonrocket",
    brand: "MoonRocket Coin",
    emoji: "🚀",
    headline: "TO THE MOON (probably not)",
    tagline: "Invest what you can't afford to lose. Classic.",
    cta: "Buy the dip",
    accent: "emerald",
    backTitle: "Whitepaper excerpt",
    backBullets: [
      "Utility: vibes",
      "Tokenomics: trust me bro",
      "Roadmap: lambo emoji",
    ],
    backFooter: "Not financial advice. Barely English advice.",
  },
];

export function pickMockAd(index: number): MockAd {
  return MOCK_ADS[index % MOCK_ADS.length];
}

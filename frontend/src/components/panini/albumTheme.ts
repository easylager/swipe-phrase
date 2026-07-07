import type { PlayerEra, PlayerRarity, SquadPlayer } from "@/types/collection";

export interface AlbumTheme {
  id: string;
  label: string;
  subtitle: string;
  headerGradient: string;
  foilClass: string;
  stamp: string;
  accent: string;
}

export const ERA_THEMES: Record<PlayerEra, AlbumTheme> = {
  current: {
    id: "wc2026",
    label: "ЧМ 2026",
    subtitle: "Official Squad · USA / CAN / MEX",
    headerGradient: "from-[#0b1f5e] via-[#1e3a8a] to-[#cf1020]",
    foilClass: "panini-foil-base",
    stamp: "WC 26",
    accent: "#cf1020",
  },
  legend: {
    id: "legends",
    label: "Legends",
    subtitle: "Hall of Fame · Three Lions",
    headerGradient: "from-[#1a1208] via-[#3d2e0a] to-[#0b1f5e]",
    foilClass: "panini-foil-gold",
    stamp: "LEGEND",
    accent: "#d4af37",
  },
  golden: {
    id: "golden",
    label: "Golden Gen",
    subtitle: "Class of '90 · Italia",
    headerGradient: "from-[#4a2800] via-[#0b1f5e] to-[#8b1a1a]",
    foilClass: "panini-foil-golden",
    stamp: "GOLD",
    accent: "#f59e0b",
  },
};

export const RARITY_FOIL: Record<PlayerRarity, string> = {
  common: "panini-foil-base",
  rare: "panini-foil-rare",
  icon: "panini-foil-icon",
};

export const ALBUM_SECTIONS: { era: PlayerEra | "all"; label: string }[] = [
  { era: "current", label: "ЧМ 2026" },
  { era: "legend", label: "Legends" },
  { era: "golden", label: "Golden Gen" },
];

export function sectionForPlayer(player: SquadPlayer): PlayerEra {
  return player.era;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function portraitVariant(playerId: string): number {
  return hashString(playerId) % 4;
}

export function portraitTone(playerId: string): { skin: string; hair: string } {
  const h = hashString(playerId);
  const skins = ["#c68642", "#8d5524", "#e0ac69", "#f1c27d", "#a67c52"];
  const hairs = ["#1a1a1a", "#3d2314", "#6b4423", "#2c1810", "#4a3728"];
  return {
    skin: skins[h % skins.length],
    hair: hairs[(h >> 3) % hairs.length],
  };
}

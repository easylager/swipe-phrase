export type PlayerEra = "current" | "golden" | "legend";
export type PlayerRarity = "common" | "rare" | "icon";

export interface SquadPlayer {
  id: string;
  name: string;
  full_name: string;
  position: string;
  number: number;
  era: PlayerEra;
  rarity: PlayerRarity;
  metric: string;
  target: number;
  current: number;
  progress: number;
  unlocked: boolean;
  unlock_hint: string;
  moment: string;
}

export interface SquadCollection {
  total: number;
  unlocked_count: number;
  wc2026_total: number;
  wc2026_unlocked: number;
  players: SquadPlayer[];
  next_unlock: SquadPlayer | null;
}

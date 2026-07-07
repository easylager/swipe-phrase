const PREFIX = "phrase_feed_squad_seen_";
const INIT_KEY = `${PREFIX}initialized`;

export function isSquadInitialized(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(INIT_KEY) === "1";
}

export function markSquadInitialized(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(INIT_KEY, "1");
}

export function getSeenPlayerIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(`${PREFIX}ids`);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

export function markPlayersSeen(ids: string[]): void {
  if (typeof window === "undefined" || ids.length === 0) return;
  const seen = getSeenPlayerIds();
  for (const id of ids) seen.add(id);
  localStorage.setItem(`${PREFIX}ids`, JSON.stringify([...seen]));
}

export function findNewUnlocks(unlockedIds: string[]): string[] {
  const seen = getSeenPlayerIds();
  return unlockedIds.filter((id) => !seen.has(id));
}

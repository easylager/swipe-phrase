import type { Stats } from "@/types/card";
import { StreakBadge } from "@/components/ComboCounter";

function swipeLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return "свайпов";
  if (mod10 === 1) return "свайп";
  if (mod10 >= 2 && mod10 <= 4) return "свайпа";
  return "свайпов";
}

interface SessionDigestProps {
  stats: Stats;
  combo?: number;
  matchdayCompact?: string | null;
}

export function SessionDigest({ stats, combo = 0, matchdayCompact = null }: SessionDigestProps) {
  const n = stats.swipes_today;

  return (
    <div className="shrink-0 px-4 pb-1 pt-1">
      <p className="mx-auto inline-flex max-w-full items-center rounded-full border border-white/10 bg-white/[0.055] px-3.5 py-2 text-xs font-semibold text-zinc-400 backdrop-blur-xl">
        Сегодня
        <span className="mx-1.5 text-sm font-black tabular-nums text-white">{n}</span>
        {swipeLabel(n)}
        <StreakBadge combo={combo} />
        {matchdayCompact && (
          <span className="ml-2 truncate rounded-full bg-blue-700/15 px-2 py-0.5 text-[10px] font-semibold text-blue-100">
            {matchdayCompact}
          </span>
        )}
      </p>
    </div>
  );
}

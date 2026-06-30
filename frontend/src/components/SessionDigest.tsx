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
}

export function SessionDigest({ stats, combo = 0 }: SessionDigestProps) {
  const n = stats.swipes_today;

  return (
    <div className="shrink-0 border-b border-white/5 px-4 py-2.5 text-center">
      <p className="text-sm text-zinc-500">
        Сегодня{" "}
        <span className="text-base font-semibold tabular-nums text-white">{n}</span>{" "}
        {swipeLabel(n)}
        <StreakBadge combo={combo} />
      </p>
    </div>
  );
}

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
  const applied = stats.applied_today ?? 0;

  return (
    <div className="shrink-0 px-4 pb-1 pt-1">
      <p className="mx-auto inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-white/10 bg-white/[0.055] px-3.5 py-2 text-xs font-semibold text-zinc-400 backdrop-blur-xl">
        <span>
          Сегодня
          <span className="mx-1.5 text-sm font-black tabular-nums text-white">{n}</span>
          {swipeLabel(n)}
        </span>
        {applied > 0 && (
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-200">
            применил {applied}
          </span>
        )}
        <StreakBadge combo={combo} />
      </p>
    </div>
  );
}

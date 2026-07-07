"use client";

import { motion } from "framer-motion";
import type { MockAd } from "@/types/feed";

interface AdCardProps {
  ad: MockAd;
  isFlipped: boolean;
}

const accentStyles = {
  violet: {
    border: "border-blue-400/25",
    glow: "from-blue-700/30 via-red-700/10 to-transparent",
    badge: "bg-blue-600/20 text-blue-100",
    cta: "bg-blue-600/20 text-blue-100 ring-blue-300/30",
    bullet: "text-blue-200/80",
  },
  amber: {
    border: "border-amber-400/25",
    glow: "from-amber-500/30 via-orange-600/10 to-transparent",
    badge: "bg-amber-500/20 text-amber-200",
    cta: "bg-amber-500/20 text-amber-200 ring-amber-400/30",
    bullet: "text-amber-300/80",
  },
  cyan: {
    border: "border-cyan-400/25",
    glow: "from-cyan-500/30 via-blue-600/10 to-transparent",
    badge: "bg-cyan-500/20 text-cyan-200",
    cta: "bg-cyan-500/20 text-cyan-200 ring-cyan-400/30",
    bullet: "text-cyan-300/80",
  },
  rose: {
    border: "border-rose-400/25",
    glow: "from-rose-500/30 via-pink-600/10 to-transparent",
    badge: "bg-rose-500/20 text-rose-200",
    cta: "bg-rose-500/20 text-rose-200 ring-rose-400/30",
    bullet: "text-rose-300/80",
  },
  emerald: {
    border: "border-emerald-400/25",
    glow: "from-emerald-500/30 via-teal-600/10 to-transparent",
    badge: "bg-emerald-500/20 text-emerald-200",
    cta: "bg-emerald-500/20 text-emerald-200 ring-emerald-400/30",
    bullet: "text-emerald-300/80",
  },
};

const faceStyle = {
  backfaceVisibility: "hidden" as const,
  WebkitBackfaceVisibility: "hidden" as const,
};

export function AdCard({ ad, isFlipped }: AdCardProps) {
  const theme = accentStyles[ad.accent];

  return (
    <div
      className={`pointer-events-none relative flex h-full w-full flex-col overflow-hidden rounded-3xl border bg-zinc-900 shadow-2xl shadow-black/40 perspective-[1200px] ${theme.border}`}
    >
      <div className="pointer-events-none relative min-h-0 flex-1">
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${theme.glow}`} />

        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.45, type: "spring", stiffness: 120, damping: 18 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front */}
          <div className="absolute inset-0 bg-zinc-900/95" style={faceStyle}>
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-8 text-center">
              <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Реклама · demo
              </span>

              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/5 text-5xl shadow-inner ring-1 ring-white/10">
                {ad.emoji}
              </div>

              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                {ad.brand}
              </p>
              <h2 className="max-w-sm text-balance text-2xl font-bold leading-snug text-white sm:text-3xl">
                {ad.headline}
              </h2>
              <p className="max-w-xs text-balance text-sm leading-relaxed text-zinc-400">
                {ad.tagline}
              </p>

              <span
                className={`mt-2 rounded-2xl px-5 py-2.5 text-sm font-semibold ring-1 ${theme.cta}`}
              >
                {ad.cta}
              </span>

              <p className="text-xs text-zinc-600">Тап — подробности · ↑ — пропустить</p>
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-zinc-900/95"
            style={{ ...faceStyle, transform: "rotateY(180deg)" }}
          >
            <div className="flex h-full flex-col items-center justify-center gap-5 px-6 py-8 text-center">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${theme.badge}`}>
                {ad.backTitle}
              </span>

              <ul className="max-w-sm space-y-3 text-left text-sm leading-relaxed text-zinc-300">
                {ad.backBullets.map((line) => (
                  <li key={line} className={`flex gap-2 ${theme.bullet}`}>
                    <span className="text-zinc-600">—</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              <p className="max-w-xs text-balance text-xs italic text-zinc-500">{ad.backFooter}</p>
              <p className="text-xs text-zinc-600">↑ свайп — вернуться к фразам</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="pointer-events-none shrink-0 border-t border-white/10 bg-zinc-950/95 px-4 py-3 text-center backdrop-blur-md">
        <p className="text-[11px] text-zinc-600">Это демо-реклама. Мы пока ничего не продаём 🫶</p>
      </div>
    </div>
  );
}

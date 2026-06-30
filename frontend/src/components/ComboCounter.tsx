"use client";

import { AnimatePresence, motion } from "framer-motion";

interface StreakBadgeProps {
  combo: number;
}

export function StreakBadge({ combo }: StreakBadgeProps) {
  return (
    <AnimatePresence>
      {combo >= 2 && (
        <motion.span
          key={combo}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="inline-flex items-center gap-1 text-orange-300/90"
        >
          <span className="text-zinc-600">·</span>
          <span className="text-sm">🔥</span>
          <span className="text-sm font-semibold tabular-nums text-orange-300">{combo}</span>
          <span className="text-sm">подряд</span>
        </motion.span>
      )}
    </AnimatePresence>
  );
}

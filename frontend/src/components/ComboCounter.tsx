"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ComboCounterProps {
  combo: number;
}

export function ComboCounter({ combo }: ComboCounterProps) {
  return (
    <AnimatePresence>
      {combo > 0 && (
        <motion.div
          key={combo}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="pointer-events-none absolute right-3 top-2 z-20 flex items-center gap-1 rounded-full bg-orange-500/20 px-3 py-1.5 backdrop-blur-sm"
        >
          <span className="text-sm">🔥</span>
          <span className="text-sm font-bold tabular-nums text-orange-300">{combo}</span>
          <span className="text-xs text-orange-300/80">знал подряд</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

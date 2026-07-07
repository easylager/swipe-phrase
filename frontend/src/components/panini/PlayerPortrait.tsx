"use client";

import { portraitTone, portraitVariant } from "@/components/panini/albumTheme";

interface PlayerPortraitProps {
  playerId: string;
  position: string;
  number: number;
  unlocked: boolean;
  className?: string;
}

/** Stylized Panini-style portrait — same art language for every player, no likeness. */
export function PlayerPortrait({
  playerId,
  position,
  number,
  unlocked,
  className = "",
}: PlayerPortraitProps) {
  const variant = portraitVariant(playerId);
  const { skin, hair } = portraitTone(playerId);
  const isGk = position === "GK";
  const isSt = position === "ST";
  const isWinger = position === "RW" || position === "LW" || position === "RM";

  const skinFill = unlocked ? skin : "#3f3f46";
  const hairFill = unlocked ? hair : "#27272a";
  const kitPrimary = unlocked ? "#f8fafc" : "#52525b";
  const kitTrim = unlocked ? "#0b1f5e" : "#3f3f46";
  const kitAccent = unlocked ? "#cf1020" : "#52525b";

  const lean = isWinger ? 8 : isSt ? 4 : 0;
  const armRaise = variant % 2 === 0 ? -6 : 4;

  return (
    <svg
      viewBox="0 0 200 220"
      className={className}
      aria-hidden
      role="img"
    >
      <defs>
        <linearGradient id={`kit-${playerId}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={kitPrimary} />
          <stop offset="100%" stopColor={unlocked ? "#e2e8f0" : "#52525b"} />
        </linearGradient>
        <radialGradient id={`glow-${playerId}`} cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor={unlocked ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.05)"} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* Stadium glow */}
      <ellipse cx="100" cy="200" rx="70" ry="12" fill={unlocked ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.4)"} />

      <g transform={`translate(${lean}, 0)`}>
        {/* Legs */}
        <rect x="78" y="155" width="18" height="42" rx="6" fill={kitTrim} />
        <rect x="104" y="155" width="18" height="42" rx="6" fill={kitTrim} />
        <rect x="76" y="188" width="22" height="10" rx="3" fill={unlocked ? "#111" : "#27272a"} />
        <rect x="102" y="188" width="22" height="10" rx="3" fill={unlocked ? "#111" : "#27272a"} />

        {/* Body / kit */}
        <path
          d="M 62 95 Q 100 88 138 95 L 132 158 Q 100 164 68 158 Z"
          fill={`url(#kit-${playerId})`}
          stroke={kitTrim}
          strokeWidth="2"
        />
        {/* Red stripe */}
        <path d="M 68 108 L 132 108 L 128 118 L 72 118 Z" fill={kitAccent} opacity={unlocked ? 1 : 0.35} />
        {/* Number on chest */}
        <text
          x="100"
          y="138"
          textAnchor="middle"
          fill={kitTrim}
          fontSize="28"
          fontWeight="900"
          fontFamily="system-ui, sans-serif"
          opacity={unlocked ? 0.9 : 0.25}
        >
          {number}
        </text>

        {/* Arms */}
        <path
          d={`M 62 98 Q 42 ${110 + armRaise} 48 ${130 + armRaise} L 58 ${125 + armRaise} Q 55 110 68 102 Z`}
          fill={`url(#kit-${playerId})`}
          stroke={kitTrim}
          strokeWidth="1.5"
        />
        <path
          d={`M 138 98 Q 158 ${105 - armRaise} 152 ${125 - armRaise} L 142 ${120 - armRaise} Q 145 108 132 102 Z`}
          fill={`url(#kit-${playerId})`}
          stroke={kitTrim}
          strokeWidth="1.5"
        />

        {/* GK gloves */}
        {isGk && unlocked && (
          <>
            <ellipse cx="48" cy={132 + armRaise} rx="10" ry="12" fill="#fbbf24" />
            <ellipse cx="152" cy={125 - armRaise} rx="10" ry="12" fill="#fbbf24" />
          </>
        )}

        {/* Neck */}
        <rect x="90" y="78" width="20" height="18" rx="4" fill={skinFill} />

        {/* Head */}
        <ellipse cx="100" cy="62" rx="26" ry="30" fill={skinFill} />
        <ellipse cx="100" cy="58" rx="24" ry="18" fill={`url(#glow-${playerId})`} />

        {/* Hair */}
        <path
          d={
            variant === 0
              ? "M 74 58 Q 100 28 126 58 Q 120 48 100 44 Q 80 48 74 58"
              : variant === 1
                ? "M 76 52 Q 100 32 124 54 L 122 62 Q 100 50 78 62 Z"
                : variant === 2
                  ? "M 72 60 Q 88 38 100 42 Q 112 38 128 60 L 120 66 Q 100 52 80 66 Z"
                  : "M 78 56 Q 100 34 122 56 Q 118 68 100 62 Q 82 68 78 56"
          }
          fill={hairFill}
        />

        {/* Face features — minimal, stylized */}
        {unlocked && (
          <>
            <ellipse cx="88" cy="64" rx="3" ry="4" fill="#1a1a1a" />
            <ellipse cx="112" cy="64" rx="3" ry="4" fill="#1a1a1a" />
            <path d="M 92 76 Q 100 80 108 76" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          </>
        )}
      </g>
    </svg>
  );
}

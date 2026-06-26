/** Adaptive typography so long phrases don't break the card layout. */
export function phraseTextClass(text: string): string {
  const len = text.length;
  if (len > 140) return "text-base leading-relaxed sm:text-lg";
  if (len > 90) return "text-lg leading-relaxed sm:text-xl";
  if (len > 55) return "text-xl leading-snug sm:text-2xl";
  if (len > 30) return "text-2xl leading-snug sm:text-3xl";
  return "text-3xl leading-snug sm:text-4xl";
}

export function contextTextClass(text: string): string {
  const len = text.length;
  if (len > 120) return "text-xs leading-relaxed";
  if (len > 70) return "text-sm leading-relaxed";
  return "text-sm leading-snug italic";
}

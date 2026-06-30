export const SNOOZE_OPTIONS = [
  { days: 2, label: "2 дня" },
  { days: 4, label: "4 дня" },
  { days: 7, label: "Неделя" },
] as const;

export type SnoozeDays = (typeof SNOOZE_OPTIONS)[number]["days"];

export function snoozeLabel(days: SnoozeDays): string {
  return SNOOZE_OPTIONS.find((o) => o.days === days)?.label ?? `${days} дн.`;
}

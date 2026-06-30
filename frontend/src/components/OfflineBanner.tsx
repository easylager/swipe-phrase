interface OfflineBannerProps {
  isOnline: boolean;
  pendingCount: number;
}

export function OfflineBanner({ isOnline, pendingCount }: OfflineBannerProps) {
  if (isOnline && pendingCount === 0) return null;

  const text = !isOnline
    ? pendingCount > 0
      ? `Офлайн · ${pendingCount} ответов ждут синхронизации`
      : "Офлайн · учишься из сохранённой сессии"
    : `Синхронизация… ${pendingCount} ответов в очереди`;

  return (
    <div className="shrink-0 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-center text-xs font-medium text-amber-200/90">
      {text}
    </div>
  );
}

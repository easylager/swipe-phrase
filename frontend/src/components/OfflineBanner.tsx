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
    <div className="shrink-0 px-4 py-2">
      <div className="rounded-full border border-amber-300/20 bg-amber-500/10 px-4 py-2 text-center text-xs font-semibold text-amber-100/90 backdrop-blur-xl">
        {text}
      </div>
    </div>
  );
}

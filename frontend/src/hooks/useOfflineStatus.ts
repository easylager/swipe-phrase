"use client";

import { useEffect, useState } from "react";
import { getPendingActionCount } from "@/lib/offlineStore";
import { isBrowserOnline } from "@/lib/network";
import { syncPendingReviews } from "@/lib/api";

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(isBrowserOnline);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const refreshPending = () => setPendingCount(getPendingActionCount());
    refreshPending();

    const onOnline = () => {
      setIsOnline(true);
      void syncPendingReviews().then(refreshPending);
    };
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("offline:pending-changed", refreshPending);

    if (isBrowserOnline()) {
      void syncPendingReviews().then(refreshPending);
    }

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("offline:pending-changed", refreshPending);
    };
  }, []);

  return { isOnline, pendingCount };
}

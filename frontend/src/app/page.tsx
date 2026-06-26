"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { AuthScreen } from "@/components/AuthScreen";
import { CardCreator } from "@/components/CardCreator";
import { StatsButton, StatsModal } from "@/components/StatsModal";
import { useAuth } from "@/contexts/AuthContext";

const SwipeFeed = dynamic(
  () => import("@/components/SwipeFeed").then((m) => m.SwipeFeed),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
      </div>
    ),
  },
);

type Tab = "feed" | "add";

export default function Home() {
  const { user, isLoading, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("feed");
  const [feedKey, setFeedKey] = useState(0);
  const [showStats, setShowStats] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="mx-auto flex h-[100dvh] max-w-lg flex-col bg-zinc-950">
      <header className="relative shrink-0 border-b border-white/5 px-4 py-4">
        <div className="pr-24">
          <h1 className="text-lg font-bold tracking-tight text-white">Phrase Feed</h1>
          <p className="truncate text-xs text-zinc-500">{user.email}</p>
        </div>
        <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2">
          <StatsButton onClick={() => setShowStats(true)} />
          <button
            type="button"
            onClick={logout}
            className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-zinc-400 transition hover:bg-white/20 hover:text-white"
          >
            Выйти
          </button>
        </div>
      </header>

      {showStats && <StatsModal onClose={() => setShowStats(false)} />}

      <main className="flex-1 overflow-hidden">
        {tab === "feed" ? (
          <SwipeFeed key={feedKey} />
        ) : (
          <div className="h-full overflow-y-auto">
            <CardCreator onCreated={() => setFeedKey((k) => k + 1)} />
          </div>
        )}
      </main>

      <nav className="shrink-0 border-t border-white/5 px-4 py-3">
        <div className="flex gap-2 rounded-2xl bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setTab("feed")}
            className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition ${
              tab === "feed" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            Лента
          </button>
          <button
            type="button"
            onClick={() => setTab("add")}
            className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition ${
              tab === "add" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            + Добавить
          </button>
        </div>
      </nav>
    </div>
  );
}

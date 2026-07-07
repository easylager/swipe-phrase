"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { AuthScreen } from "@/components/AuthScreen";
import { CardCreator } from "@/components/CardCreator";
import { InstallPrompt } from "@/components/InstallPrompt";
import { StatsButton, StatsModal } from "@/components/StatsModal";
import { useAuth } from "@/contexts/AuthContext";
import { useVisualKeyboard } from "@/hooks/useVisualKeyboard";

const SwipeFeed = dynamic(
  () => import("@/components/SwipeFeed").then((m) => m.SwipeFeed),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-300 border-t-transparent" />
      </div>
    ),
  },
);

type Tab = "feed" | "add";

function NavIcon({ tab }: { tab: Tab }) {
  if (tab === "feed") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
        <path d="M9 8h6M9 12h6M9 16h3" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

export default function Home() {
  const { user, isLoading, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("feed");
  const [feedKey, setFeedKey] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const keyboardOpen = useVisualKeyboard();
  const hideNav = tab === "add" && keyboardOpen;

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-300 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="premium-shell mx-auto flex h-[100dvh] max-w-lg flex-col overflow-hidden">
      <header className="relative z-20 shrink-0 px-4 pb-3 pt-3">
        <div className="glass-panel flex items-center justify-between rounded-[1.7rem] px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-200/80">
              Phrase Feed
            </p>
            <h1 className="mt-0.5 truncate text-lg font-semibold tracking-tight text-white">
              {tab === "feed" ? "Твоя лента" : "Новая фраза"}
            </h1>
            <p className="truncate text-xs text-zinc-500">{user.email}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StatsButton onClick={() => setShowStats(true)} />
            <button
              type="button"
              onClick={logout}
              className="tap-scale flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-zinc-400 hover:bg-white/10 hover:text-white"
              aria-label="Выйти"
              title="Выйти"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-[18px] w-[18px]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M10 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-2" />
                <path d="M15 12H3m4-4-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <InstallPrompt />

      {showStats && <StatsModal onClose={() => setShowStats(false)} />}

      <main className="flex-1 overflow-hidden">
        {tab === "feed" ? (
          <SwipeFeed key={feedKey} />
        ) : (
          <div className="h-full overflow-y-auto overscroll-contain pb-safe">
            <CardCreator onCreated={() => setFeedKey((k) => k + 1)} />
          </div>
        )}
      </main>

      {!hideNav && (
        <nav className="nav-safe relative z-20 shrink-0 px-4 pt-3">
          <div className="glass-panel flex gap-2 rounded-[1.65rem] p-1.5">
            {(["feed", "add"] as const).map((item) => {
              const active = tab === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTab(item)}
                  className={`tap-scale flex flex-1 items-center justify-center gap-2 rounded-[1.25rem] py-3 text-sm font-semibold ${
                    active
                      ? "bg-white text-zinc-950 shadow-lg shadow-blue-900/30"
                      : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <NavIcon tab={item} />
                  {item === "feed" ? "Лента" : "Добавить"}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

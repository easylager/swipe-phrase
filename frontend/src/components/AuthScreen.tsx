"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isStandalonePwa } from "@/lib/pwa";

type Mode = "login" | "register";

export function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Что-то пошло не так");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="premium-shell mx-auto flex h-[100dvh] max-w-lg flex-col justify-center px-5">
      <div className="mb-8 text-center">
        <div
          aria-hidden="true"
          className="mx-auto mb-5 h-16 w-16 rounded-[1.45rem] bg-[url('/apple-touch-icon.png')] bg-cover bg-center shadow-2xl shadow-violet-500/20"
        />
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-violet-300/80">
          Phrase Feed
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Твои фразы</h1>
        <p className="mt-2 text-sm text-zinc-400">Личная лента для английского без лишнего шума</p>
        {isStandalonePwa() && (
          <p className="mt-4 rounded-2xl border border-violet-300/15 bg-violet-500/10 px-4 py-3 text-xs leading-relaxed text-violet-100/90">
            Открыто с иконки на экране — войди здесь один раз. Это отдельное приложение от Safari,
            логин из браузера сюда не переносится.
          </p>
        )}
      </div>

      <div className="glass-panel mb-5 flex rounded-[1.45rem] p-1.5">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`tap-scale flex-1 rounded-[1.05rem] py-3 text-sm font-bold ${
            mode === "login" ? "bg-white text-zinc-950" : "text-zinc-400 hover:text-white"
          }`}
        >
          Вход
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`tap-scale flex-1 rounded-[1.05rem] py-3 text-sm font-bold ${
            mode === "register" ? "bg-white text-zinc-950" : "text-zinc-400 hover:text-white"
          }`}
        >
          Регистрация
        </button>
      </div>

      <form onSubmit={submit} className="glass-panel space-y-4 rounded-[1.8rem] p-4">
        <label className="block">
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
            Email
          </span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-[1.25rem] border border-white/10 bg-white/[0.055] px-4 py-4 text-white outline-none transition focus:border-violet-300/40 focus:ring-4 focus:ring-violet-500/10"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
            Пароль
          </span>
          <input
            type="password"
            required
            minLength={mode === "register" ? 8 : 1}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-[1.25rem] border border-white/10 bg-white/[0.055] px-4 py-4 text-white outline-none transition focus:border-violet-300/40 focus:ring-4 focus:ring-violet-500/10"
          />
          {mode === "register" && (
            <span className="mt-1.5 block text-xs text-zinc-600">Минимум 8 символов</span>
          )}
        </label>

        {error && (
          <p className="rounded-2xl border border-red-300/15 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="tap-scale w-full rounded-[1.25rem] bg-white py-4 text-sm font-black text-zinc-950 shadow-xl shadow-violet-500/15 disabled:opacity-50"
        >
          {busy ? "..." : mode === "login" ? "Войти" : "Создать аккаунт"}
        </button>
      </form>
    </div>
  );
}

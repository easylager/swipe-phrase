"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

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
    <div className="mx-auto flex h-[100dvh] max-w-lg flex-col justify-center bg-zinc-950 px-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white">Phrase Feed</h1>
        <p className="mt-2 text-sm text-zinc-500">Твои фразы — только твои</p>
      </div>

      <div className="mb-6 flex rounded-2xl bg-white/5 p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition ${
            mode === "login" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"
          }`}
        >
          Вход
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition ${
            mode === "register" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"
          }`}
        >
          Регистрация
        </button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
            Email
          </span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
            Пароль
          </span>
          <input
            type="password"
            required
            minLength={mode === "register" ? 8 : 1}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
          />
          {mode === "register" && (
            <span className="mt-1.5 block text-xs text-zinc-600">Минимум 8 символов</span>
          )}
        </label>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl bg-violet-600 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
        >
          {busy ? "..." : mode === "login" ? "Войти" : "Создать аккаунт"}
        </button>
      </form>
    </div>
  );
}

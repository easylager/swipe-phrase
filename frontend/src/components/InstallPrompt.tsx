"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  canShowInstallPrompt,
  dismissInstallPrompt,
  isIos,
  isIosSafari,
  needsSafariForInstall,
  promptAndroidInstall,
  subscribeAndroidInstall,
} from "@/lib/pwa";

function Step({
  number,
  title,
  detail,
}: {
  number: number;
  title: ReactNode;
  detail?: string;
}) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">
        {number}
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="text-sm leading-snug text-white">{title}</p>
        {detail && <p className="mt-1 text-xs leading-relaxed text-zinc-500">{detail}</p>}
      </div>
    </li>
  );
}

export function InstallPrompt() {
  const [open, setOpen] = useState(false);
  const [iosSafari, setIosSafari] = useState(false);
  const [iosOtherBrowser, setIosOtherBrowser] = useState(false);
  const [onIos, setOnIos] = useState(false);
  const [androidReady, setAndroidReady] = useState(false);

  useEffect(() => {
    if (!canShowInstallPrompt()) return;

    setOnIos(isIos());
    setIosSafari(isIosSafari());
    setIosOtherBrowser(needsSafariForInstall());

    const unsub = subscribeAndroidInstall(() => setAndroidReady(true));

    const timer = window.setTimeout(() => setOpen(true), 1200);
    return () => {
      window.clearTimeout(timer);
      unsub();
    };
  }, []);

  const close = (remember = true) => {
    if (remember) dismissInstallPrompt();
    setOpen(false);
  };

  const handleAndroidInstall = async () => {
    const installed = await promptAndroidInstall();
    if (installed) close();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center"
      onClick={() => close(false)}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start gap-3">
          <div
            aria-hidden="true"
            className="h-12 w-12 shrink-0 rounded-2xl bg-[url('/apple-touch-icon.png')] bg-cover bg-center"
          />
          <div>
            <h2 className="text-xl font-bold text-white">
              {onIos ? "Добавь на экран iPhone" : androidReady ? "Установи Phrase Feed" : "Добавь на домашний экран"}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Так Phrase Feed откроется как обычное приложение — без адресной строки Safari, логин
              сохранится между запусками.
            </p>
          </div>
        </div>

        {iosOtherBrowser && (
          <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
            Сначала открой сайт в <strong>Safari</strong> — в Chrome и других браузерах на iPhone
            установка недоступна.
          </div>
        )}

        {iosSafari && (
          <ol className="space-y-4">
            <Step
              number={1}
              title={
                <>
                  Внизу Safari нажми{" "}
                  <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-0.5 font-medium text-zinc-200">
                    <ShareIcon />
                    Поделиться
                  </span>
                </>
              }
              detail="Кнопка в центре нижней панели — квадрат со стрелкой вверх."
            />
            <Step
              number={2}
              title={
                <>
                  В меню выбери{" "}
                  <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-0.5 font-medium text-zinc-200">
                    <PlusIcon />
                    На экран «Домой»
                  </span>
                </>
              }
              detail="Может быть чуть ниже в списке — пролистай вниз."
            />
            <Step
              number={3}
              title="Нажми «Добавить» в правом верхнем углу"
              detail="На домашнем экране появится иконка Phrase Feed."
            />
            <Step
              number={4}
              title="Открой приложение с иконки и войди в аккаунт"
              detail="Логин из Safari сюда не переносится — это отдельное приложение. Войди один раз с иконки, и сессия сохранится."
            />
          </ol>
        )}

        {!onIos && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">
              Добавь ярлык на домашний экран — быстрый доступ и работа офлайн.
            </p>
            {androidReady && (
              <button
                type="button"
                onClick={() => void handleAndroidInstall()}
                className="w-full rounded-2xl bg-blue-700 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-600"
              >
                Установить приложение
              </button>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => close(true)}
            className="w-full rounded-2xl bg-white/10 py-3.5 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            {iosSafari ? "Понятно, сделаю" : "Понятно"}
          </button>
          <button
            type="button"
            onClick={() => close(false)}
            className="w-full py-2 text-xs text-zinc-500 transition hover:text-zinc-300"
          >
            Напомнить позже
          </button>
        </div>
      </div>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v10" strokeLinecap="round" />
      <path d="m7 8 5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M12 8v8M8 12h8" strokeLinecap="round" />
    </svg>
  );
}

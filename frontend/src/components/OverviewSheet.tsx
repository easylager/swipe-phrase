"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { parseOverview } from "@/lib/parseOverview";
import type { Card } from "@/types/card";

interface OverviewSheetProps {
  english: string;
  overview: string;
  status: Card["overview_status"];
  onClose: () => void;
  onRegenerate?: () => void;
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-400/90">
      {children}
    </h3>
  );
}

function TextSection({ title, body }: { title: string; body: string }) {
  const isTranscription = title === "ТРАНСКРИПЦИЯ";

  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      <div
        className={`text-sm leading-relaxed text-zinc-300 ${
          isTranscription ? "font-mono text-[15px] text-amber-200/90" : ""
        }`}
      >
        {body.split("\n").map((line, i) => (
          <p key={i} className={i > 0 ? "mt-1 text-zinc-400" : ""}>
            {line}
          </p>
        ))}
      </div>
    </section>
  );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-zinc-300">
            <span className="mt-0.5 shrink-0 text-violet-400/70">—</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SuggestionsSection({
  items,
  onAdded,
}: {
  items: { english: string; translation: string }[];
  onAdded?: () => void;
}) {
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());

  const handleAdd = async (english: string, translation: string) => {
    if (adding || added.has(english)) return;
    setAdding(english);
    try {
      await api.createCard({ english, translation });
      setAdded((prev) => new Set(prev).add(english));
      onAdded?.();
    } catch {
      /* ignore */
    } finally {
      setAdding(null);
    }
  };

  return (
    <section className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
      <SectionTitle>Похожее в ленту</SectionTitle>
      <ul className="space-y-2">
        {items.map((item) => {
          const isAdded = added.has(item.english);
          const isLoading = adding === item.english;

          return (
            <li
              key={item.english}
              className="flex items-start justify-between gap-3 rounded-xl bg-black/20 px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">{item.english}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{item.translation}</p>
              </div>
              <button
                type="button"
                disabled={isAdded || isLoading}
                onClick={() => void handleAdd(item.english, item.translation)}
                className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  isAdded
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-violet-600/80 text-white hover:bg-violet-500 disabled:opacity-60"
                }`}
              >
                {isAdded ? "✓" : isLoading ? "…" : "+ лента"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function OverviewContent({ overview }: { overview: string }) {
  const { sections } = parseOverview(overview);

  return (
    <div className="space-y-5">
      {sections.map((section) => {
        if (section.kind === "text") {
          return <TextSection key={section.title} title={section.title} body={section.body} />;
        }
        if (section.kind === "list") {
          return <ListSection key={section.title} title={section.title} items={section.items} />;
        }
        return <SuggestionsSection key={section.title} items={section.items} />;
      })}
    </div>
  );
}

export function OverviewSheet({
  english,
  overview,
  status,
  onClose,
  onRegenerate,
}: OverviewSheetProps) {
  return (
    <div
      className="absolute inset-0 z-20 flex items-end bg-black/70 backdrop-blur-sm"
      data-no-swipe
      onClick={onClose}
    >
      <div
        className="max-h-[78%] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-violet-400">Обзор</p>
            <p className="mt-1 text-lg font-semibold text-white">{english}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 px-3 py-1 text-sm text-zinc-300 hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        {status === "generating" || status === "idle" || status === "pending" ? (
          <div className="flex items-center gap-3 py-8 text-zinc-400">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
            <span className="text-sm">Нейросеть пишет обзор...</span>
          </div>
        ) : status === "failed" ? (
          <div className="py-6 text-center">
            <p className="text-sm text-zinc-400">Не удалось сгенерировать обзор</p>
            <p className="mt-2 text-xs text-zinc-500">
              Проверь GROQ_API_KEY на сервере или попробуй ещё раз
            </p>
            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
              >
                Попробовать снова
              </button>
            )}
          </div>
        ) : (
          <>
            <OverviewContent overview={overview} />
            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="mt-6 w-full rounded-xl bg-white/5 py-2.5 text-sm text-zinc-500 transition hover:bg-white/10 hover:text-zinc-300"
              >
                Обновить обзор
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface OverviewButtonProps {
  status: Card["overview_status"];
  onClick: () => void;
}

export function OverviewButton({ status, onClick }: OverviewButtonProps) {
  if (status === "skipped") return null;

  const labels: Record<string, string> = {
    idle: "Обзор",
    pending: "Обзор",
    generating: "Обзор…",
    ready: "Обзор",
    failed: "Обзор ✕",
  };

  const isLoading = status === "generating";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
        status === "ready"
          ? "bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
          : status === "failed"
            ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
            : "bg-white/5 text-zinc-500"
      }`}
    >
      {isLoading && (
        <span className="inline-block h-3 w-3 animate-spin rounded-full border border-zinc-500 border-t-transparent" />
      )}
      {labels[status] ?? "Обзор"}
    </button>
  );
}

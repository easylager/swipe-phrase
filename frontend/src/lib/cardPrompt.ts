import type { Card, PromptLang } from "@/types/card";

export function randomPromptLang(): PromptLang {
  return Math.random() < 0.5 ? "en" : "ru";
}

export function withRandomPromptLang(card: Card): Card {
  return { ...card, prompt_lang: randomPromptLang() };
}

/** Keep stable prompt language when session is refreshed in background. */
export function mergeSessionCards(prev: Card[], incoming: Card[]): Card[] {
  const langById = new Map(prev.map((c) => [c.id, c.prompt_lang]));
  return incoming.map((c) => ({
    ...c,
    prompt_lang: langById.get(c.id) ?? randomPromptLang(),
  }));
}

export function getCardFaces(card: Card) {
  const promptLang = card.prompt_lang ?? "en";
  const isEnglishFront = promptLang === "en";

  return {
    promptLang,
    frontText: isEnglishFront ? card.english : card.translation,
    backText: isEnglishFront ? card.translation : card.english,
    frontLang: isEnglishFront ? ("en" as const) : ("ru" as const),
    backLang: isEnglishFront ? ("ru" as const) : ("en" as const),
    frontLabel: isEnglishFront ? "English" : "Русский",
    backLabel: isEnglishFront ? "Перевод" : "English",
  };
}

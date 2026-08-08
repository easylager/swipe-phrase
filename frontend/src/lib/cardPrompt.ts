import type { Card, PromptLang } from "@/types/card";

export function randomPromptLang(): PromptLang {
  return Math.random() < 0.5 ? "en" : "ru";
}

/** Assign front language for a feed appearance. EN-learned cards only show RU. */
export function withSessionPromptLang(card: Card): Card {
  if (card.learned_en) {
    return { ...card, prompt_lang: "ru" };
  }
  return { ...card, prompt_lang: randomPromptLang() };
}

/** @deprecated use withSessionPromptLang */
export function withRandomPromptLang(card: Card): Card {
  return withSessionPromptLang(card);
}

/** Keep stable prompt language when session is refreshed in background. */
export function mergeSessionCards(prev: Card[], incoming: Card[]): Card[] {
  const langById = new Map(prev.map((c) => [c.id, c.prompt_lang]));
  return incoming.map((c) => {
    if (c.learned_en) {
      return { ...c, prompt_lang: "ru" as const };
    }
    return {
      ...c,
      prompt_lang: langById.get(c.id) ?? randomPromptLang(),
    };
  });
}

export function getCardFaces(card: Card) {
  const promptLang = card.learned_en ? "ru" : (card.prompt_lang ?? "en");
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

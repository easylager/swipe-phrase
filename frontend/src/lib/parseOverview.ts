export interface OverviewSuggestion {
  english: string;
  translation: string;
}

export interface ParsedOverview {
  sections: OverviewSection[];
}

export interface OverviewTextSection {
  kind: "text";
  title: string;
  body: string;
}

export interface OverviewListSection {
  kind: "list";
  title: string;
  items: string[];
}

export interface OverviewSuggestionsSection {
  kind: "suggestions";
  title: string;
  items: OverviewSuggestion[];
}

export type OverviewSection =
  | OverviewTextSection
  | OverviewListSection
  | OverviewSuggestionsSection;

const SECTION_TITLES = [
  "СМЫСЛ",
  "ТРАНСКРИПЦИЯ",
  "ПРИМЕРЫ",
  "КОГДА УМЕСТНО",
  "ПОЧЕМУ ТАК",
  "ПОХОЖЕЕ В ЛЕНТУ",
] as const;

const LIST_SECTIONS = new Set<string>(["ПРИМЕРЫ", "КОГДА УМЕСТНО"]);
const SUGGESTIONS_SECTION = "ПОХОЖЕЕ В ЛЕНТУ";

function normalizeLine(line: string): string {
  return line.trim();
}

function isSectionHeader(line: string): string | null {
  const upper = line.toUpperCase().replace(/:$/, "").trim();
  return SECTION_TITLES.includes(upper as (typeof SECTION_TITLES)[number]) ? upper : null;
}

function parseListItem(line: string): string | null {
  const trimmed = normalizeLine(line);
  const match = trimmed.match(/^(?:—|–|-|\*)\s*(.+)$/);
  return match ? match[1].trim() : null;
}

function parseSuggestion(line: string): OverviewSuggestion | null {
  const trimmed = parseListItem(line) ?? normalizeLine(line);
  const dash = trimmed.match(/^(.+?)\s*[—–-]\s*(.+)$/);
  if (!dash) return null;
  const english = dash[1].replace(/^["«]|["»]$/g, "").trim();
  const translation = dash[2].trim();
  if (!english || !translation) return null;
  return { english, translation };
}

function buildSection(title: string, lines: string[]): OverviewSection | null {
  const body = lines.join("\n").trim();
  if (!body) return null;

  if (title === SUGGESTIONS_SECTION) {
    const items = lines
      .map((line) => parseSuggestion(line))
      .filter((item): item is OverviewSuggestion => item !== null);
    return items.length > 0 ? { kind: "suggestions", title, items } : null;
  }

  if (LIST_SECTIONS.has(title)) {
    const items = lines
      .map((line) => parseListItem(line) ?? normalizeLine(line))
      .filter(Boolean);
    return items.length > 0 ? { kind: "list", title, items } : null;
  }

  return { kind: "text", title, body };
}

/** Parse structured overview text from the LLM into display sections. */
export function parseOverview(raw: string): ParsedOverview {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const sections: OverviewSection[] = [];
  let currentTitle: string | null = null;
  let currentLines: string[] = [];

  const flush = () => {
    if (!currentTitle) return;
    const section = buildSection(currentTitle, currentLines);
    if (section) sections.push(section);
    currentTitle = null;
    currentLines = [];
  };

  for (const line of lines) {
    const header = isSectionHeader(normalizeLine(line));
    if (header) {
      flush();
      currentTitle = header;
      continue;
    }
    if (currentTitle) currentLines.push(line);
  }

  flush();

  if (sections.length === 0 && raw.trim()) {
    sections.push({ kind: "text", title: "ОБЗОР", body: raw.trim() });
  }

  return { sections };
}

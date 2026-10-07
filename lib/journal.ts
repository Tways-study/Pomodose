// Mirrors the textarea's maxLength in components/journal-card.tsx and the cap
// enforced in convex/journal.ts — the mutation is reachable directly.
export const MAX_JOURNAL_TEXT_LENGTH = 2000;

/** Trims surrounding whitespace; "" means "no entry". */
export function normalizeJournalText(text: string): string {
  return text.trim();
}

export function isJournalTextTooLong(text: string): boolean {
  return normalizeJournalText(text).length > MAX_JOURNAL_TEXT_LENGTH;
}

/** First non-empty line, shortened with an ellipsis, for the past-entries list. */
export function previewLine(text: string, max = 60): string {
  const first = text.split("\n").find((line) => line.trim().length > 0)?.trim() ?? "";
  return first.length > max ? `${first.slice(0, max - 1).trimEnd()}…` : first;
}

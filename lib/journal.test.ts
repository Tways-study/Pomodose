import { describe, expect, it } from "vitest";
import {
  MAX_JOURNAL_TEXT_LENGTH,
  isJournalTextTooLong,
  normalizeJournalText,
  previewLine,
} from "./journal";

describe("normalizeJournalText", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeJournalText("  hello \n")).toBe("hello");
  });

  it("returns an empty string for whitespace only", () => {
    expect(normalizeJournalText(" \n\t ")).toBe("");
  });
});

describe("isJournalTextTooLong", () => {
  it("allows exactly the cap", () => {
    expect(isJournalTextTooLong("a".repeat(MAX_JOURNAL_TEXT_LENGTH))).toBe(false);
  });

  it("rejects one over the cap", () => {
    expect(isJournalTextTooLong("a".repeat(MAX_JOURNAL_TEXT_LENGTH + 1))).toBe(true);
  });

  it("measures the trimmed text", () => {
    expect(isJournalTextTooLong(`  ${"a".repeat(MAX_JOURNAL_TEXT_LENGTH)}  `)).toBe(false);
  });
});

describe("previewLine", () => {
  it("uses the first non-empty line", () => {
    expect(previewLine("\n\n  First line\nSecond")).toBe("First line");
  });

  it("shortens long lines with an ellipsis", () => {
    const out = previewLine("a".repeat(100), 20);
    expect(out).toHaveLength(20);
    expect(out.endsWith("…")).toBe(true);
  });

  it("returns an empty string for empty text", () => {
    expect(previewLine("")).toBe("");
  });
});

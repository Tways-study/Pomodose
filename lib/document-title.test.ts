import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flashCompletionTitle, resetTitle, setRunningTitle } from "./document-title";

const DEFAULT_TITLE = "Pomodose — Study Companion";
const HEADLINE = "Dose dispensed";
const FLASH_TITLE = `${HEADLINE} — Pomodose`;

function setHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", { value: hidden, configurable: true });
  Object.defineProperty(document, "visibilityState", {
    value: hidden ? "hidden" : "visible",
    configurable: true,
  });
}

describe("document-title", () => {
  beforeEach(() => {
    document.title = DEFAULT_TITLE;
    setHidden(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    setHidden(false);
    document.title = DEFAULT_TITLE;
  });

  it("sets a formatted countdown + phase title while running", () => {
    setRunningTitle("focus", 754);
    expect(document.title).toBe("12:34 · Dose — Pomodose");
  });

  it("sets the flash title once and does not start an interval when the tab is visible", () => {
    vi.useFakeTimers();
    flashCompletionTitle(HEADLINE);
    expect(document.title).toBe(FLASH_TITLE);

    vi.advanceTimersByTime(5000);
    expect(document.title).toBe(FLASH_TITLE);
  });

  it("alternates the title on an interval when the tab is hidden", () => {
    vi.useFakeTimers();
    setHidden(true);
    flashCompletionTitle(HEADLINE);
    expect(document.title).toBe(FLASH_TITLE);

    vi.advanceTimersByTime(1000);
    expect(document.title).toBe(DEFAULT_TITLE);

    vi.advanceTimersByTime(1000);
    expect(document.title).toBe(FLASH_TITLE);
  });

  it("stops flashing and restores the default title once the tab regains focus", () => {
    vi.useFakeTimers();
    setHidden(true);
    flashCompletionTitle(HEADLINE);
    vi.advanceTimersByTime(1000);
    expect(document.title).toBe(DEFAULT_TITLE);

    setHidden(false);
    document.dispatchEvent(new Event("visibilitychange"));
    expect(document.title).toBe(DEFAULT_TITLE);

    vi.advanceTimersByTime(3000);
    expect(document.title).toBe(DEFAULT_TITLE);
  });

  it("resetTitle clears an active flash and restores the default title", () => {
    vi.useFakeTimers();
    setHidden(true);
    flashCompletionTitle(HEADLINE);

    resetTitle();
    expect(document.title).toBe(DEFAULT_TITLE);

    vi.advanceTimersByTime(3000);
    expect(document.title).toBe(DEFAULT_TITLE);
  });

  it("uses a different event's headline verbatim in the flash title", () => {
    vi.useFakeTimers();
    flashCompletionTitle("Full cycle");
    expect(document.title).toBe("Full cycle — Pomodose");
  });
});

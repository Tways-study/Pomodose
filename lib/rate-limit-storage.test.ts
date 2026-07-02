import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadRateLimit, saveRateLimit } from "./rate-limit-storage";

const STORAGE_KEY = "apothecary_dosey_limited_until";

describe("rate-limit storage", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("returns null when nothing is stored", () => {
    expect(loadRateLimit()).toBeNull();
  });

  it("round-trips a saved state with a future resetAt", () => {
    const resetAt = new Date(Date.now() + 60_000).toISOString();
    saveRateLimit(resetAt);
    expect(loadRateLimit()).toEqual({ resetAt });
  });

  it("treats a past resetAt as not-limited (Dosey's back)", () => {
    const resetAt = new Date(Date.now() - 1000).toISOString();
    saveRateLimit(resetAt);
    expect(loadRateLimit()).toBeNull();
  });

  it("returns null on malformed JSON", () => {
    localStorage.setItem(STORAGE_KEY, "not json {");
    expect(loadRateLimit()).toBeNull();
  });

  it("returns null when the stored shape fails validation", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ resetAt: 12345 }));
    expect(loadRateLimit()).toBeNull();
  });
});

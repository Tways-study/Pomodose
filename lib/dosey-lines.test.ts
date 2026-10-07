import { describe, expect, it } from "vitest";
import { DIZZY_LINE, MOOD_LINES, POKE_LINES, nextPokeLine } from "./dosey-lines";

describe("dosey lines", () => {
  it("has non-empty lines of at most 80 chars", () => {
    const all = [...POKE_LINES, ...Object.values(MOOD_LINES), DIZZY_LINE];
    for (const line of all) {
      expect(line.length).toBeGreaterThan(0);
      expect(line.length).toBeLessThanOrEqual(80);
    }
    expect(POKE_LINES.length).toBeGreaterThanOrEqual(8);
  });

  it("never repeats the previous index", () => {
    for (let prev = 0; prev < POKE_LINES.length; prev++) {
      for (const r of [0, 0.25, 0.5, 0.99, 1]) {
        const next = nextPokeLine(prev, () => r);
        expect(next).not.toBe(prev);
        expect(next).toBeGreaterThanOrEqual(0);
        expect(next).toBeLessThan(POKE_LINES.length);
      }
    }
  });

  it("handles an out-of-range prevIndex", () => {
    const next = nextPokeLine(-1, () => 0.5);
    expect(next).toBeGreaterThanOrEqual(0);
    expect(next).toBeLessThan(POKE_LINES.length);
  });
});

import { describe, expect, it } from "vitest";
import {
  DOSEY_TIMING,
  POKE_COMBO_WINDOW_MS,
  momentFor,
  pickInRange,
  registerPoke,
} from "./dosey-motion";

describe("momentFor", () => {
  it("is null on first mount or an unchanged mood", () => {
    expect(momentFor(null, "focused", false)).toBeNull();
    expect(momentFor("relaxed", "relaxed", false)).toBeNull();
  });

  it("wakes when sleepy becomes focused, startling from deep sleep", () => {
    expect(momentFor("sleepy", "focused", false)).toBe("wake");
    expect(momentFor("sleepy", "focused", true)).toBe("startle");
  });

  it("exhales into relaxed from focused or sleepy", () => {
    expect(momentFor("focused", "relaxed", false)).toBe("exhale");
    expect(momentFor("sleepy", "relaxed", false)).toBe("exhale");
    expect(momentFor("proud", "relaxed", false)).toBeNull();
  });

  it("dozes into sleepy from anywhere", () => {
    expect(momentFor("focused", "sleepy", false)).toBe("doze");
    expect(momentFor("proud", "sleepy", false)).toBe("doze");
    expect(momentFor("relaxed", "sleepy", true)).toBe("doze");
  });

  it("holds when a running mood pauses", () => {
    expect(momentFor("focused", "waiting", false)).toBe("hold");
    expect(momentFor("relaxed", "waiting", false)).toBe("hold");
    expect(momentFor("proud", "waiting", false)).toBeNull();
  });

  it("resumes from waiting into focused or relaxed", () => {
    expect(momentFor("waiting", "focused", false)).toBe("resume");
    expect(momentFor("waiting", "relaxed", false)).toBe("resume");
  });

  it("celebrates whenever it turns proud", () => {
    for (const prev of ["sleepy", "focused", "relaxed", "waiting"] as const) {
      expect(momentFor(prev, "proud", false)).toBe("celebrate");
    }
  });

  it("has no moment for proud to focused", () => {
    expect(momentFor("proud", "focused", false)).toBeNull();
  });
});

describe("registerPoke", () => {
  it("is not dizzy for the first two pokes", () => {
    const a = registerPoke([], 0);
    expect(a.dizzy).toBe(false);
    const b = registerPoke(a.history, 300);
    expect(b.dizzy).toBe(false);
    expect(b.history).toEqual([0, 300]);
  });

  it("is dizzy on the third poke inside the window, then resets", () => {
    const c = registerPoke([0, 600], POKE_COMBO_WINDOW_MS);
    expect(c.dizzy).toBe(true);
    expect(c.history).toEqual([]);
  });

  it("is not dizzy when the oldest poke just fell out of the window", () => {
    const c = registerPoke([0, 600], POKE_COMBO_WINDOW_MS + 1);
    expect(c.dizzy).toBe(false);
    expect(c.history).toEqual([600, POKE_COMBO_WINDOW_MS + 1]);
  });

  it("does not mutate the input history", () => {
    const input = [0, 100];
    registerPoke(input, 200);
    expect(input).toEqual([0, 100]);
  });

  it("needs a fresh run of three after a combo fires", () => {
    const first = registerPoke([0, 100], 200);
    expect(first.dizzy).toBe(true);
    expect(registerPoke(first.history, 300).dizzy).toBe(false);
  });
});

describe("pickInRange", () => {
  it("maps the random source onto the range", () => {
    expect(pickInRange([2, 4], () => 0)).toBe(2);
    expect(pickInRange([2, 4], () => 0.5)).toBe(3);
  });

  it("keeps every blink range ordered", () => {
    for (const [min, max] of Object.values(DOSEY_TIMING.blinkS)) {
      expect(min).toBeLessThan(max);
    }
  });
});

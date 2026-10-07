import { describe, expect, it } from "vitest";
import { JAR, completesCycle, dropOffset, jarSlots, jarWobble, lidLift, lidPop } from "./jar";
import { THREE_FX } from "./fx";

describe("jarSlots", () => {
  it("returns n slots, capped at the visible maximum", () => {
    expect(jarSlots(0)).toHaveLength(0);
    expect(jarSlots(5)).toHaveLength(5);
    expect(jarSlots(99)).toHaveLength(THREE_FX.JAR_MAX_VISIBLE);
  });
  it("is deterministic and prefix-stable so existing capsules never move", () => {
    expect(jarSlots(7)).toEqual(jarSlots(12).slice(0, 7));
    expect(jarSlots(12)).toEqual(jarSlots(12));
  });
  it("layers from the bottom up without decreasing in height", () => {
    const slots = jarSlots(12);
    for (let i = 1; i < slots.length; i++) expect(slots[i].y).toBeGreaterThanOrEqual(slots[i - 1].y);
    expect(slots[slots.length - 1].y).toBeGreaterThan(slots[0].y);
  });
  it("keeps every capsule inside the jar", () => {
    for (const s of jarSlots(12)) {
      expect(Math.hypot(s.x, s.z)).toBeLessThan(JAR.RADIUS);
      expect(Math.abs(s.y)).toBeLessThan(JAR.HEIGHT / 2);
    }
  });
});

describe("animation curves", () => {
  it("drop starts high and settles to zero", () => {
    expect(dropOffset(0)).toBe(1);
    expect(dropOffset(1)).toBeCloseTo(0);
    expect(dropOffset(0.5)).toBeGreaterThanOrEqual(0);
  });
  it("lid lifts then returns to rest", () => {
    expect(lidLift(0)).toBe(0);
    expect(lidLift(0.5)).toBeGreaterThan(0);
    expect(lidLift(1)).toBe(0);
  });
  it("pop and wobble are zero outside their window and non-zero inside", () => {
    expect(lidPop(-0.1)).toBe(0);
    expect(lidPop(1)).toBe(0);
    expect(lidPop(0.2)).toBeGreaterThan(0);
    expect(jarWobble(-1)).toBe(0);
    expect(jarWobble(1.2)).toBe(0);
    expect(Math.abs(jarWobble(0.1))).toBeGreaterThan(0);
  });
});

describe("completesCycle", () => {
  it("is true on every fourth dose only", () => {
    expect([0, 1, 3, 4, 5, 8].map(completesCycle)).toEqual([false, false, false, true, false, true]);
  });
});

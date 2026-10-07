import { describe, expect, it } from "vitest";
import { DIORAMA_ITEMS, dioramaPose, loginLayout, loginPose } from "./scene-layout";

describe("loginLayout", () => {
  it("uses ten capsules, seven of them lilac, on wide screens", () => {
    const items = loginLayout(1.6);
    expect(items).toHaveLength(10);
    expect(items.filter((c) => c.tone === "lilac")).toHaveLength(7);
  });
  it("keeps the central card column clear", () => {
    for (const c of loginLayout(1.6)) expect(Math.abs(c.nx)).toBeGreaterThanOrEqual(0.55);
  });
  it("uses fewer, smaller capsules on phones", () => {
    const wide = loginLayout(1.6);
    const narrow = loginLayout(0.5);
    expect(narrow.length).toBeLessThan(wide.length);
    expect(Math.max(...narrow.map((c) => c.scale))).toBeLessThanOrEqual(Math.max(...wide.map((c) => c.scale)));
  });
  it("has periods of 6 to 10 seconds", () => {
    for (const c of loginLayout(1.6)) {
      expect(c.period).toBeGreaterThanOrEqual(6);
      expect(c.period).toBeLessThanOrEqual(10);
    }
  });
});

describe("loginPose", () => {
  it("bobs around the home position and is periodic", () => {
    const c = loginLayout(1.6)[0];
    const a = loginPose(c, 0, 5, 4);
    const b = loginPose(c, c.period, 5, 4);
    expect(a.y).toBeCloseTo(b.y);
    expect(Math.abs(a.y - c.ny * 4)).toBeLessThanOrEqual(0.22 + 1e-9);
  });
});

describe("diorama", () => {
  it("has at most ten objects across three depth layers", () => {
    expect(DIORAMA_ITEMS.length).toBeLessThanOrEqual(10);
    expect(new Set(DIORAMA_ITEMS.map((i) => i.layer)).size).toBe(3);
  });
  it("keeps items out of Dosey's lower-left area", () => {
    for (const i of DIORAMA_ITEMS) expect(i.nx > 0 || i.ny > 0.8).toBe(true);
    for (const i of DIORAMA_ITEMS.filter((i) => i.nx < 0.2)) expect(i.ny).toBeGreaterThan(0.8);
  });
  it("drifts only a little", () => {
    const i = DIORAMA_ITEMS[0];
    const p0 = dioramaPose(i, 0, 3, 3);
    const p1 = dioramaPose(i, 3, 3, 3);
    expect(Math.hypot(p1.x - p0.x, p1.y - p0.y)).toBeLessThan(0.7);
  });
});

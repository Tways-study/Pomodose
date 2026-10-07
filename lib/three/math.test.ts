import { describe, expect, it } from "vitest";
import { clamp, easeOutBounce, easeToward, seededRandom } from "./math";

describe("math", () => {
  it("clamps", () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(-5, 0, 1)).toBe(0);
  });
  it("eases toward a target without overshooting", () => {
    const next = easeToward(0, 10, 0.016, 3);
    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(10);
    expect(easeToward(10, 10, 1, 3)).toBe(10);
  });
  it("bounce runs 0 to 1", () => {
    expect(easeOutBounce(0)).toBe(0);
    expect(easeOutBounce(1)).toBeCloseTo(1);
  });
  it("seeds deterministically within [0, 1)", () => {
    const a = seededRandom(9);
    const b = seededRandom(9);
    for (let i = 0; i < 20; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

import { describe, expect, it } from "vitest";
import { seededRandom } from "./math";
import { initParticles, isDone, particleScale, stepParticle, toneForEvent } from "./burst";
import { THREE_FX } from "./fx";

describe("toneForEvent", () => {
  it("maps completions to phase tones", () => {
    expect(toneForEvent("focus-complete")).toBe("sky");
    expect(toneForEvent("short-complete")).toBe("mint");
    expect(toneForEvent("long-complete")).toBe("apricot");
    expect(toneForEvent("cycle-complete")).toBe("apricot");
  });
  it("ignores other events", () => {
    expect(toneForEvent("first-dose")).toBeNull();
    expect(toneForEvent("overdose")).toBeNull();
  });
});

describe("initParticles", () => {
  it("creates the requested count, all launching upward", () => {
    const ps = initParticles(THREE_FX.BURST_COUNT, seededRandom(1));
    expect(ps).toHaveLength(THREE_FX.BURST_COUNT);
    for (const p of ps) {
      expect(p.vy).toBeGreaterThan(0);
      expect(p.life).toBeLessThanOrEqual(THREE_FX.BURST_DURATION);
      expect(p.x).toBe(0);
      expect(p.y).toBe(0);
    }
  });
  it("is deterministic for a seeded generator", () => {
    expect(initParticles(5, seededRandom(7))).toEqual(initParticles(5, seededRandom(7)));
  });
});

describe("stepParticle", () => {
  const [p0] = initParticles(1, seededRandom(3));
  it("does not mutate its input and advances age", () => {
    const before = { ...p0 };
    const next = stepParticle(p0, 0.1);
    expect(p0).toEqual(before);
    expect(next.age).toBeCloseTo(0.1);
  });
  it("applies gravity to vertical velocity only", () => {
    const next = stepParticle(p0, 0.1);
    expect(next.vy).toBeCloseTo(p0.vy - THREE_FX.BURST_GRAVITY * 0.1);
    expect(next.vx).toBe(p0.vx);
  });
  it("falls out of view with no floor", () => {
    let p = p0;
    for (let i = 0; i < 120; i++) p = stepParticle(p, 0.02);
    expect(p.y).toBeLessThan(0);
  });
});

describe("particleScale / isDone", () => {
  const [base] = initParticles(1, seededRandom(5));
  it("is full size mid-life and zero at end of life", () => {
    expect(particleScale({ ...base, age: base.life * 0.5 })).toBeCloseTo(base.size);
    expect(particleScale({ ...base, age: base.life })).toBe(0);
  });
  it("shrinks monotonically through the last 30%", () => {
    const a = particleScale({ ...base, age: base.life * 0.8 });
    const b = particleScale({ ...base, age: base.life * 0.95 });
    expect(a).toBeLessThan(base.size);
    expect(b).toBeLessThan(a);
  });
  it("reports completion by age", () => {
    expect(isDone({ ...base, age: base.life - 0.01 })).toBe(false);
    expect(isDone({ ...base, age: base.life })).toBe(true);
  });
});

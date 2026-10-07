import { describe, expect, it } from "vitest";
import {
  FLASK,
  FLASK_PROFILE,
  SPLASH_SECONDS,
  bubblePose,
  dropletPose,
  levelY,
  makeBubbles,
  makeDroplets,
  radiusAt,
  surfaceHeight,
  swayPose,
} from "./flask";

describe("FLASK_PROFILE", () => {
  it("starts on the axis at the base and ends at the neck rim", () => {
    expect(FLASK_PROFILE[0]).toEqual({ r: 0, y: 0 });
    const top = FLASK_PROFILE[FLASK_PROFILE.length - 1];
    expect(top.y).toBeCloseTo(FLASK.HEIGHT);
    expect(top.r).toBeCloseTo(0.4);
  });

  it("never goes back down", () => {
    for (let i = 1; i < FLASK_PROFILE.length; i++) {
      expect(FLASK_PROFILE[i].y).toBeGreaterThanOrEqual(FLASK_PROFILE[i - 1].y);
    }
  });
});

describe("radiusAt", () => {
  it("is the body radius low down and the neck radius up high", () => {
    expect(radiusAt(0.35)).toBeCloseTo(1.8);
    expect(radiusAt(4.2)).toBeCloseTo(0.4);
  });

  it("narrows monotonically through the cone", () => {
    let prev = Infinity;
    for (let y = 0.4; y <= 3.8; y += 0.2) {
      const r = radiusAt(y);
      expect(r).toBeLessThanOrEqual(prev + 1e-9);
      prev = r;
    }
  });

  it("clamps outside the flask", () => {
    expect(radiusAt(-1)).toBeCloseTo(1.45);
    expect(radiusAt(99)).toBeCloseTo(0.4);
  });
});

describe("levelY", () => {
  it("maps 0 and 1 to the liquid bounds and clamps beyond", () => {
    expect(levelY(0)).toBe(FLASK.LIQUID_BOTTOM);
    expect(levelY(1)).toBe(FLASK.LIQUID_TOP);
    expect(levelY(-3)).toBe(FLASK.LIQUID_BOTTOM);
    expect(levelY(7)).toBe(FLASK.LIQUID_TOP);
  });
});

describe("surfaceHeight", () => {
  it("is flat with no energy and zero on the rim", () => {
    expect(surfaceHeight(0.3, 0.2, 1.7, 0)).toBeCloseTo(0);
    expect(surfaceHeight(1, 0, 1.7, 1)).toBeCloseTo(0);
  });

  it("grows with energy", () => {
    const low = Math.abs(surfaceHeight(0.2, 0.1, 0.5, 0.2));
    const high = Math.abs(surfaceHeight(0.2, 0.1, 0.5, 1));
    expect(high).toBeGreaterThan(low);
  });
});

describe("swayPose", () => {
  it("is still at amount 0 and bounded at amount 1", () => {
    const still = swayPose(3.2, 0);
    expect(still.rotZ).toBeCloseTo(0);
    expect(still.rotX).toBeCloseTo(0);
    expect(still.y).toBeCloseTo(0);
    for (let t = 0; t < 20; t += 0.7) {
      const p = swayPose(t, 1);
      expect(Math.abs(p.rotZ)).toBeLessThanOrEqual(0.03);
      expect(Math.abs(p.y)).toBeLessThanOrEqual(0.03);
    }
  });
});

describe("bubblePose", () => {
  const specs = makeBubbles(14);

  it("is deterministic", () => {
    expect(makeBubbles(14)).toEqual(specs);
  });

  it("hides every bubble when there is too little liquid", () => {
    for (const s of specs) expect(bubblePose(s, 3, levelY(0.05)).scale).toBe(0);
  });

  it("keeps bubbles inside the glass and below the surface", () => {
    const level = levelY(0.8);
    for (let t = 0; t < 30; t += 0.37) {
      for (const s of specs) {
        const b = bubblePose(s, t, level);
        expect(b.scale).toBeGreaterThanOrEqual(0);
        expect(b.y).toBeLessThanOrEqual(level);
        const wall = radiusAt(b.y) * FLASK.GLASS_INSET;
        expect(Math.hypot(b.x, b.z)).toBeLessThanOrEqual(wall);
      }
    }
  });
});

describe("dropletPose", () => {
  const specs = makeDroplets(10);
  const level = levelY(0.5);

  it("is hidden before launch and after the splash ends", () => {
    for (const s of specs) {
      if (s.delay > 0) expect(dropletPose(s, 0, level).scale).toBe(0);
      expect(dropletPose(s, SPLASH_SECONDS + 0.1, level).scale).toBe(0);
    }
  });

  it("rises above the surface, stays under the ceiling and inside the glass", () => {
    let sawRise = false;
    for (const s of specs) {
      for (let since = 0; since <= SPLASH_SECONDS; since += 0.05) {
        const d = dropletPose(s, since, level);
        if (d.scale === 0) continue;
        sawRise = true;
        expect(d.y).toBeGreaterThanOrEqual(level);
        expect(d.y).toBeLessThanOrEqual(FLASK.SPLASH_CEILING);
        expect(Math.hypot(d.x, d.z)).toBeLessThanOrEqual(radiusAt(d.y) * FLASK.GLASS_INSET);
      }
    }
    expect(sawRise).toBe(true);
  });

  it("falls back into the liquid", () => {
    for (const s of specs) expect(dropletPose(s, SPLASH_SECONDS - 0.01, level).scale).toBe(0);
  });
});

import { describe, expect, it } from "vitest";
import {
  CYLINDER,
  CYLINDER_PROFILE,
  CYLINDER_VESSEL,
  FLASK,
  FLASK_PROFILE,
  FLASK_VESSEL,
  GLASS_INSET,
  SPLASH_SECONDS,
  VESSELS,
  bubblePose,
  cylinderTicks,
  dropletPose,
  levelY,
  makeBubbles,
  makeDroplets,
  radiusAt,
  surfaceHeight,
  swayPose,
} from "./vessel";

describe("FLASK_PROFILE", () => {
  it("starts on the axis at the base and ends at the neck rim", () => {
    expect(FLASK_PROFILE[0]).toEqual({ r: 0, y: 0 });
    const top = FLASK_PROFILE[FLASK_PROFILE.length - 1];
    expect(top.y).toBeCloseTo(FLASK.HEIGHT);
    expect(top.r).toBeCloseTo(0.4);
  });
});

describe("CYLINDER_PROFILE", () => {
  it("starts on the axis and ends at the flared lip", () => {
    expect(CYLINDER_PROFILE[0]).toEqual({ r: 0, y: 0.6 });
    const top = CYLINDER_PROFILE[CYLINDER_PROFILE.length - 1];
    expect(top.y).toBeCloseTo(CYLINDER.HEIGHT);
    expect(top.r).toBeGreaterThan(CYLINDER.RADIUS);
  });

  it("is a straight tube between the corner and the lip", () => {
    for (const y of [1, 2, 3, 4]) expect(radiusAt(y, CYLINDER_PROFILE)).toBeCloseTo(CYLINDER.RADIUS);
  });
});

describe("profiles", () => {
  it.each(Object.values(VESSELS))("never goes back down ($id)", (vessel) => {
    for (let i = 1; i < vessel.profile.length; i++) {
      expect(vessel.profile[i].y).toBeGreaterThanOrEqual(vessel.profile[i - 1].y);
    }
  });

  it.each(Object.values(VESSELS))("keeps the liquid range inside the glass ($id)", (vessel) => {
    const top = vessel.profile[vessel.profile.length - 1].y;
    expect(vessel.liquidBottom).toBeGreaterThanOrEqual(vessel.profile[0].y);
    expect(vessel.liquidTop).toBeLessThan(top);
    expect(vessel.splashCeiling).toBeLessThanOrEqual(top);
  });
});

describe("radiusAt", () => {
  it("is the body radius low down and the neck radius up high on the flask", () => {
    expect(radiusAt(0.35)).toBeCloseTo(1.8);
    expect(radiusAt(4.2)).toBeCloseTo(0.4);
  });

  it("narrows monotonically through the flask cone", () => {
    let prev = Infinity;
    for (let y = 0.4; y <= 3.8; y += 0.2) {
      const r = radiusAt(y);
      expect(r).toBeLessThanOrEqual(prev + 1e-9);
      prev = r;
    }
  });

  it("clamps outside the vessel", () => {
    expect(radiusAt(-1)).toBeCloseTo(1.45);
    expect(radiusAt(99)).toBeCloseTo(0.4);
    expect(radiusAt(0, CYLINDER_PROFILE)).toBeCloseTo(0.35);
  });
});

describe("levelY", () => {
  it.each(Object.values(VESSELS))("maps 0 and 1 to the liquid bounds and clamps beyond ($id)", (vessel) => {
    expect(levelY(0, vessel)).toBe(vessel.liquidBottom);
    expect(levelY(1, vessel)).toBe(vessel.liquidTop);
    expect(levelY(-3, vessel)).toBe(vessel.liquidBottom);
    expect(levelY(7, vessel)).toBe(vessel.liquidTop);
  });

  it("defaults to the flask", () => {
    expect(levelY(0.5)).toBe(levelY(0.5, FLASK_VESSEL));
  });
});

describe("cylinderTicks", () => {
  const ticks = cylinderTicks();

  it("has ten ticks, descending, all inside the liquid range", () => {
    expect(ticks).toHaveLength(10);
    for (let i = 0; i < ticks.length; i++) {
      expect(ticks[i].y).toBeGreaterThan(CYLINDER_VESSEL.liquidBottom);
      expect(ticks[i].y).toBeLessThanOrEqual(CYLINDER_VESSEL.liquidTop);
      if (i > 0) expect(ticks[i].y).toBeLessThan(ticks[i - 1].y);
    }
  });

  it("labels the majors 100 to 20 and leaves the minors blank", () => {
    expect(ticks.filter((t) => t.major).map((t) => t.label)).toEqual(["100", "80", "60", "40", "20"]);
    expect(ticks.filter((t) => !t.major).every((t) => t.label === null)).toBe(true);
  });

  it("puts the 100 mark at the full level", () => {
    expect(ticks[0].y).toBe(CYLINDER_VESSEL.liquidTop);
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

  it.each(Object.values(VESSELS))("hides every bubble when there is too little liquid ($id)", (vessel) => {
    for (const s of specs) expect(bubblePose(s, 3, levelY(0.02, vessel), vessel).scale).toBe(0);
  });

  it.each(Object.values(VESSELS))("keeps bubbles inside the glass and below the surface ($id)", (vessel) => {
    const level = levelY(0.8, vessel);
    for (let t = 0; t < 30; t += 0.37) {
      for (const s of specs) {
        const b = bubblePose(s, t, level, vessel);
        expect(b.scale).toBeGreaterThanOrEqual(0);
        expect(b.y).toBeLessThanOrEqual(level);
        const wall = radiusAt(b.y, vessel.profile) * GLASS_INSET;
        expect(Math.hypot(b.x, b.z)).toBeLessThanOrEqual(wall);
      }
    }
  });
});

describe("dropletPose", () => {
  const specs = makeDroplets(10);

  it.each(Object.values(VESSELS))("is hidden before launch and after the splash ends ($id)", (vessel) => {
    const level = levelY(0.5, vessel);
    for (const s of specs) {
      if (s.delay > 0) expect(dropletPose(s, 0, level, vessel).scale).toBe(0);
      expect(dropletPose(s, SPLASH_SECONDS + 0.1, level, vessel).scale).toBe(0);
    }
  });

  it.each(Object.values(VESSELS))("rises above the surface, stays under the ceiling and inside the glass ($id)", (vessel) => {
    const level = levelY(0.5, vessel);
    let sawRise = false;
    for (const s of specs) {
      for (let since = 0; since <= SPLASH_SECONDS; since += 0.05) {
        const d = dropletPose(s, since, level, vessel);
        if (d.scale === 0) continue;
        sawRise = true;
        expect(d.y).toBeGreaterThanOrEqual(level);
        expect(d.y).toBeLessThanOrEqual(vessel.splashCeiling);
        expect(Math.hypot(d.x, d.z)).toBeLessThanOrEqual(radiusAt(d.y, vessel.profile) * GLASS_INSET);
      }
    }
    expect(sawRise).toBe(true);
  });

  it("falls back into the liquid", () => {
    const level = levelY(0.5);
    for (const s of specs) expect(dropletPose(s, SPLASH_SECONDS - 0.01, level).scale).toBe(0);
  });
});

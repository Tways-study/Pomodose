import { clamp, seededRandom } from "./math";

/** One point of a vessel's half-section: radius from the axis, height above the base. */
export interface ProfilePoint {
  r: number;
  y: number;
}

export type VesselId = "flask" | "cylinder";

export interface VesselSpec {
  id: VesselId;
  /** The glass silhouette, bottom centre up to the rim. */
  profile: readonly ProfilePoint[];
  /** Surface height when the vessel is empty / full. */
  liquidBottom: number;
  liquidTop: number;
  /** Highest point a splash droplet may reach (still inside the glass). */
  splashCeiling: number;
  /** Height the camera looks at. */
  lookY: number;
}

/** The liquid wall sits inside the glass by this factor so the two never z-fight. */
export const GLASS_INSET = 0.92;

// Both vessels are the SVG vessels in vial-timer.tsx at 1 unit = 40 SVG units.

type Pair = readonly [number, number];

function quad(p0: Pair, p1: Pair, p2: Pair, steps: number): ProfilePoint[] {
  const out: ProfilePoint[] = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    out.push({
      r: u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
      y: u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
    });
  }
  return out;
}

function cubic(p0: Pair, p1: Pair, p2: Pair, p3: Pair, steps: number): ProfilePoint[] {
  const out: ProfilePoint[] = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    out.push({
      r: u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0],
      y: u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1],
    });
  }
  return out;
}

// --- Flask -------------------------------------------------------------------

export const FLASK = {
  HEIGHT: 4.6,
  CAP_RADIUS: 0.6,
  CAP_HEIGHT: 0.35,
  CAP_Y: 4.675,
} as const;

/** The flask silhouette, bottom centre up to the neck rim: flat base, soft corner, cone, neck. */
export const FLASK_PROFILE: readonly ProfilePoint[] = [
  { r: 0, y: 0 },
  { r: 1.45, y: 0 },
  ...quad([1.45, 0], [1.8, 0], [1.8, 0.35], 6),
  ...cubic([1.8, 0.35], [1.8, 1.325], [0.4, 3.5], [0.4, 3.85], 22),
  { r: 0.4, y: FLASK.HEIGHT },
];

export const FLASK_VESSEL: VesselSpec = {
  id: "flask",
  profile: FLASK_PROFILE,
  liquidBottom: 0.05,
  liquidTop: 3.85,
  splashCeiling: 4.3,
  lookY: 2.3,
};

// --- Graduated cylinder ------------------------------------------------------

export const CYLINDER = {
  RADIUS: 0.55,
  HEIGHT: 4.9,
  /** The collar ring around the rim. */
  RIM_Y: 4.78,
  RIM_RADIUS: 0.6,
  /** Tick marks sit on the glass at the right-hand side of the front. */
  TICK_MAJOR_FROM_X: 0.2,
  TICK_MINOR_FROM_X: 0.35,
} as const;

/** Round-bottomed tube with a slightly flared lip, sitting in its foot. */
export const CYLINDER_PROFILE: readonly ProfilePoint[] = [
  { r: 0, y: 0.6 },
  { r: 0.35, y: 0.6 },
  ...quad([0.35, 0.6], [0.55, 0.6], [0.55, 0.8], 5),
  { r: CYLINDER.RADIUS, y: 4.75 },
  { r: 0.68, y: CYLINDER.HEIGHT },
];

/** The flared round foot, bottom centre up to the top face (the glass sits inside it). */
export const CYLINDER_FOOT_PROFILE: readonly ProfilePoint[] = [
  { r: 0, y: 0 },
  { r: 1.15, y: 0 },
  { r: 1.4, y: 0.3 },
  { r: 1.05, y: 0.65 },
  { r: 0, y: 0.65 },
];

export const CYLINDER_VESSEL: VesselSpec = {
  id: "cylinder",
  profile: CYLINDER_PROFILE,
  liquidBottom: 0.65,
  liquidTop: 4.7,
  splashCeiling: 4.6,
  lookY: 2.45,
};

export const VESSELS: Record<VesselId, VesselSpec> = {
  flask: FLASK_VESSEL,
  cylinder: CYLINDER_VESSEL,
};

export interface Tick {
  y: number;
  major: boolean;
  /** Printed value for major ticks (percent of the full volume). */
  label: string | null;
}

/** Graduation marks, 10% apart, majors labelled 100 down to 20 (as on the SVG cylinder). */
export function cylinderTicks(): Tick[] {
  const ticks: Tick[] = [];
  for (let i = 10; i >= 1; i--) {
    const frac = i / 10;
    const major = i % 2 === 0;
    ticks.push({ y: levelY(frac, CYLINDER_VESSEL), major, label: major ? String(i * 10) : null });
  }
  return ticks;
}

// --- Shared maths ------------------------------------------------------------

/** Radius of the glass at height `y` (linear between profile points). */
export function radiusAt(y: number, profile: readonly ProfilePoint[] = FLASK_PROFILE): number {
  const top = profile[profile.length - 1];
  const yy = clamp(y, profile[0].y, top.y);
  for (let i = 1; i < profile.length; i++) {
    const a = profile[i - 1];
    const b = profile[i];
    if (b.y > a.y && yy >= a.y && yy <= b.y) return a.r + ((b.r - a.r) * (yy - a.y)) / (b.y - a.y);
  }
  return top.r;
}

/** Surface height for a fill fraction in [0, 1]. */
export function levelY(fraction: number, vessel: VesselSpec = FLASK_VESSEL): number {
  return vessel.liquidBottom + (vessel.liquidTop - vessel.liquidBottom) * clamp(fraction, 0, 1);
}

const smooth = (x: number) => {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};

// --- Surface slosh -----------------------------------------------------------

const WAVE_AMPLITUDE = 0.11;

/**
 * Height offset of the liquid surface at (nx, nz) on the unit disc. Zero on the
 * rim so the surface always meets the wall; `energy` scales the whole wave.
 */
export function surfaceHeight(nx: number, nz: number, t: number, energy: number): number {
  const falloff = Math.max(0, 1 - nx * nx - nz * nz);
  const wave = Math.sin(nx * 2.6 + t * 2.4) * 0.6 + Math.cos(nz * 2.1 - t * 1.9) * 0.4;
  return WAVE_AMPLITUDE * energy * falloff * wave;
}

// --- Idle sway ---------------------------------------------------------------

export interface SwayPose {
  rotZ: number;
  rotX: number;
  y: number;
}

/** A barely-there tilt and bob of the whole vessel; `amount` in [0, 1] fades it in. */
export function swayPose(t: number, amount: number): SwayPose {
  return {
    rotZ: Math.sin(t * 0.9) * 0.028 * amount,
    rotX: Math.sin(t * 0.7 + 1) * 0.012 * amount,
    y: Math.sin(t * 1.4) * 0.025 * amount,
  };
}

// --- Rising bubbles ----------------------------------------------------------

export interface BubbleSpec {
  phase: number;   // 0..1 offset into the rise cycle
  speed: number;   // cycles per second
  angle: number;
  radial: number;  // 0..1 share of the available radius
  size: number;    // world units
  wobble: number;
}

export interface Pose {
  x: number;
  y: number;
  z: number;
  scale: number;
}

export function makeBubbles(count: number, seed = 4242): BubbleSpec[] {
  const rand = seededRandom(seed);
  return Array.from({ length: count }, () => ({
    phase: rand(),
    speed: 0.12 + rand() * 0.16,
    angle: rand() * Math.PI * 2,
    radial: 0.1 + rand() * 0.65,
    size: 0.07 + rand() * 0.07,
    wobble: rand() * Math.PI * 2,
  }));
}

const MIN_RISE = 0.3;

/** Where a bubble is at time `t`; scale 0 when hidden (too little liquid, or just born/popped). */
export function bubblePose(spec: BubbleSpec, t: number, level: number, vessel: VesselSpec = FLASK_VESSEL): Pose {
  const floor = vessel.liquidBottom + 0.25;
  const top = level - 0.06;
  if (top - floor < MIN_RISE) return { x: 0, y: floor, z: 0, scale: 0 };
  const p = (spec.phase + spec.speed * t) % 1;
  const y = floor + (top - floor) * p;
  const room = Math.max(0, radiusAt(y, vessel.profile) * GLASS_INSET - spec.size - 0.03);
  const rr = room * spec.radial;
  const drift = Math.sin(t * 2.1 + spec.wobble) * 0.04;
  return {
    x: Math.cos(spec.angle) * rr + drift,
    y,
    z: Math.sin(spec.angle) * rr,
    scale: spec.size * smooth(p / 0.12) * (1 - smooth((p - 0.92) / 0.08)),
  };
}

// --- Completion splash -------------------------------------------------------

export interface DropletSpec {
  angle: number;
  speed: number;   // horizontal, units/s
  lift: number;    // initial vertical speed, units/s
  size: number;
  delay: number;   // seconds after the splash starts
}

export const SPLASH_SECONDS = 1.8;
const GRAVITY = 9;

export function makeDroplets(count: number, seed = 777): DropletSpec[] {
  const rand = seededRandom(seed);
  return Array.from({ length: count }, (_, i) => ({
    angle: (i / count) * Math.PI * 2 + rand() * 0.5,
    speed: 0.25 + rand() * 0.35,
    lift: 2.6 + rand() * 1.4,
    size: 0.06 + rand() * 0.05,
    delay: rand() * 0.12,
  }));
}

/** A droplet thrown from the surface; scale 0 before launch and once it falls back in. */
export function dropletPose(spec: DropletSpec, since: number, level: number, vessel: VesselSpec = FLASK_VESSEL): Pose {
  const tt = since - spec.delay;
  if (tt < 0 || since > SPLASH_SECONDS) return { x: 0, y: level, z: 0, scale: 0 };
  const rise = level + spec.lift * tt - 0.5 * GRAVITY * tt * tt;
  if (rise < level) return { x: 0, y: level, z: 0, scale: 0 };
  const y = Math.min(rise, vessel.splashCeiling);
  const room = Math.max(0, radiusAt(y, vessel.profile) * GLASS_INSET - spec.size - 0.02);
  const r = Math.min(spec.speed * tt, room);
  return { x: Math.cos(spec.angle) * r, y, z: Math.sin(spec.angle) * r, scale: spec.size };
}

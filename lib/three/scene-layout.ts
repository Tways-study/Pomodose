import { seededRandom } from "./math";
import type { Tone } from "./palette";

// ---------- Login capsules ----------

export interface LoginCapsule {
  nx: number;       // -1..1 across the visible width
  ny: number;       // -1..1 across the visible height
  z: number;        // depth (negative = further away)
  scale: number;
  tone: Tone;
  period: number;   // bob/tumble period, seconds
  phase: number;
  spin: number;     // tumble speed multiplier
}

export interface Pose {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
}

const rand = seededRandom(424242);

function capsule(nx: number, ny: number, z: number, scale: number, tone: Tone): LoginCapsule {
  return {
    nx,
    ny,
    z,
    scale,
    tone,
    period: 6 + rand() * 4,
    phase: rand() * Math.PI * 2,
    spin: 0.6 + rand() * 0.8,
  };
}

// Kept toward the edges so the centered card column and its text stay clear.
const WIDE: LoginCapsule[] = [
  capsule(-0.86, 0.62, 0, 1.15, "lilac"),
  capsule(-0.66, -0.2, -2, 0.8, "lilac"),
  capsule(-0.9, -0.72, 1, 1.3, "lilac"),
  capsule(-0.58, 0.9, -3, 0.65, "sky"),
  capsule(0.88, 0.7, 0, 1.2, "lilac"),
  capsule(0.62, 0.1, -3, 0.7, "lilac"),
  capsule(0.9, -0.55, 1, 1.35, "lilac"),
  capsule(0.66, -0.9, -2, 0.8, "lilac"),
  capsule(-0.8, -0.1, -1, 0.6, "mint"),
  capsule(0.8, 0.95, -1, 0.55, "sky"),
];

const NARROW: LoginCapsule[] = [
  capsule(-0.86, 0.9, 0, 0.7, "lilac"),
  capsule(0.88, 0.82, -1, 0.55, "sky"),
  capsule(-0.84, -0.88, -1, 0.6, "mint"),
  capsule(0.86, -0.9, 0, 0.75, "lilac"),
];

/** Portrait/phone viewports get fewer, smaller capsules. */
export function loginLayout(aspect: number): LoginCapsule[] {
  return aspect < 1 ? NARROW : WIDE;
}

/** Slow sin-based bob and tumble around the capsule's home position. */
export function loginPose(c: LoginCapsule, t: number, halfW: number, halfH: number): Pose {
  const w = (t / c.period) * Math.PI * 2 + c.phase;
  return {
    x: c.nx * halfW,
    y: c.ny * halfH + Math.sin(w) * 0.22,
    z: c.z,
    rx: Math.sin(w * 0.7) * 0.5 * c.spin + c.phase,
    ry: Math.cos(w * 0.5) * 0.4 * c.spin,
    rz: w * 0.25 * c.spin + c.phase * 0.5,
  };
}

// ---------- Dosey diorama ----------

export type DioramaKind = "pill" | "leaf" | "tomato";

export interface DioramaItem {
  kind: DioramaKind;
  tone: Tone;
  nx: number;       // -1..1 across the stage
  ny: number;
  layer: 0 | 1 | 2; // depth layer, 2 is furthest
  scale: number;
  period: number;
  phase: number;
}

export const DIORAMA_LAYER_Z = [-2, -4, -6] as const;
export const DIORAMA_LAYER_OPACITY = [0.9, 0.75, 0.6] as const;

const d = seededRandom(1337);
function item(kind: DioramaKind, tone: Tone, nx: number, ny: number, layer: 0 | 1 | 2, scale: number): DioramaItem {
  return { kind, tone, nx, ny, layer, scale, period: 8 + d() * 6, phase: d() * Math.PI * 2 };
}

// Mostly upper/right, away from Dosey's face in the lower-left of the stage.
export const DIORAMA_ITEMS: readonly DioramaItem[] = [
  item("pill", "sky", 0.55, 0.78, 0, 1),
  item("pill", "mint", 0.9, 0.35, 1, 0.9),
  item("pill", "sky", 0.05, 0.9, 2, 0.8),
  item("pill", "butter", 0.8, -0.35, 2, 0.8),
  item("leaf", "sprout", 0.3, 0.55, 1, 1),
  item("leaf", "sprout", 0.92, 0.82, 0, 0.9),
  item("leaf", "sprout", 0.62, 0.05, 2, 0.9),
  item("tomato", "tomato", 0.78, 0.6, 1, 0.8),
  item("tomato", "tomato", 0.42, 0.95, 2, 0.7),
  item("tomato", "tomato", 0.95, -0.1, 0, 0.7),
];

export function dioramaPose(it: DioramaItem, t: number, halfW: number, halfH: number): Pose {
  const w = (t / it.period) * Math.PI * 2 + it.phase;
  return {
    x: it.nx * halfW + Math.sin(w * 0.8) * 0.15,
    y: it.ny * halfH + Math.sin(w) * 0.2,
    z: DIORAMA_LAYER_Z[it.layer],
    rx: Math.sin(w * 0.6) * 0.5,
    ry: w * 0.3,
    rz: Math.cos(w * 0.7) * 0.6 + it.phase,
  };
}

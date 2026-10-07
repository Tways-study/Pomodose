import { THREE_FX } from "./fx";
import { clamp, easeOutBounce, seededRandom } from "./math";

export interface JarSlot {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
}

export const JAR = {
  RADIUS: 1,
  HEIGHT: 2.6,
  CAPSULE_RADIUS: 0.27,
  CAPSULE_LENGTH: 0.5,
  LAYER_PITCH: 0.55,
  SLOT_RADIUS: 0.5,
} as const;

/** Deterministic resting poses, layered from the bottom up. Capsules lie on their sides. */
export function jarSlots(n: number): JarSlot[] {
  const count = clamp(Math.floor(n), 0, THREE_FX.JAR_MAX_VISIBLE);
  const rand = seededRandom(20260507);
  const floor = -JAR.HEIGHT / 2 + 0.1 + JAR.CAPSULE_RADIUS;
  return Array.from({ length: THREE_FX.JAR_MAX_VISIBLE }, (_, i) => {
    const layer = Math.floor(i / THREE_FX.JAR_PER_LAYER);
    const inLayer = i % THREE_FX.JAR_PER_LAYER;
    const angle = (inLayer / THREE_FX.JAR_PER_LAYER) * Math.PI * 2 + layer * 0.7;
    // Jitter is drawn for every slot in order so a slot never depends on `n`.
    const jx = (rand() - 0.5) * 0.3;
    const jy = (rand() - 0.5) * 0.5;
    const jz = (rand() - 0.5) * 0.25;
    return {
      x: Math.cos(angle) * JAR.SLOT_RADIUS,
      y: floor + layer * JAR.LAYER_PITCH,
      z: Math.sin(angle) * JAR.SLOT_RADIUS,
      rx: jx,
      ry: -angle + Math.PI / 2 + jy,
      rz: Math.PI / 2 + jz,
    };
  }).slice(0, count);
}

/** 1 above the lid at t=0 down to 0 (resting) at t=1, with a bounce. */
export function dropOffset(t: number): number {
  return 1 - easeOutBounce(t);
}

/** The lid rises while a capsule drops in, holds, then settles back. */
export function lidLift(t: number): number {
  const u = clamp(t, 0, 1);
  if (u < 0.2) return (u / 0.2) * 0.9;
  if (u < 0.8) return 0.9;
  return ((1 - u) / 0.2) * 0.9;
}

/** A damped lid pop for the cycle-complete flourish; 0 outside [0, 1). */
export function lidPop(t: number): number {
  if (t < 0 || t >= 1) return 0;
  return Math.abs(Math.sin(t * Math.PI * 2.2)) * 1.4 * (1 - t);
}

/** A damped side-to-side wobble of the whole jar, in radians; 0 outside [0, 1). */
export function jarWobble(t: number): number {
  if (t < 0 || t >= 1) return 0;
  return Math.sin(t * Math.PI * 6) * 0.12 * (1 - t);
}

/** True when this increment of the daily dose count completes a four-dose cycle. */
export function completesCycle(dailyDoses: number): boolean {
  return dailyDoses > 0 && dailyDoses % 4 === 0;
}

import type { DoseyMood } from "@/lib/dosey-mood";

export type DoseyVariant = "full" | "face" | "peek";

// Eyelid scaleY at rest per mood (0 = open, 1 = shut).
export const LID_REST: Record<DoseyMood, number> = {
  sleepy: 0.55,
  focused: 0.25,
  relaxed: 0,
  proud: 0,
  waiting: 0.1,
};

/** Deep sleep lid position (see SETTINGS.DOSEY_DEEP_SLEEP_SECONDS). */
export const DEEP_SLEEP_LID = 0.85;

// Size tiers. Below IDLE_MIN_SIZE: blink, finite moments and the thinking gaze
// only (no infinite body loops, no fx). Fx need a bigger rig to stay legible.
export const IDLE_MIN_SIZE = 40;
export const FX_MIN_SIZE = 56;
export const BLUSH_MIN_SIZE = 28;

/** Scripted glance distance in SVG units; the bigger-eyed face variant needs more. */
export const THINKING_GAZE: Record<DoseyVariant, number> = { full: 2.5, peek: 2.5, face: 4.5 };

export const MOODS: DoseyMood[] = ["sleepy", "focused", "relaxed", "proud", "waiting"];

/** Hidden "dizzy" eye: a small spiral centred on (cx, cy). */
export function spiralPath(cx: number, cy: number, r: number): string {
  const steps = 36;
  const turns = 2.2;
  let d = `M${cx} ${cy}`;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const a = t * turns * Math.PI * 2;
    const rad = r * 1.15 * t;
    d += ` L${(cx + Math.cos(a) * rad).toFixed(2)} ${(cy + Math.sin(a) * rad).toFixed(2)}`;
  }
  return d;
}

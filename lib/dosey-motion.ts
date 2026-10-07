import type { DoseyMood } from "@/lib/dosey-mood";

/** One-shot reactions played when Dosey's mood changes. */
export type DoseyMoment = "wake" | "startle" | "exhale" | "doze" | "hold" | "resume" | "celebrate";

type Range = readonly [min: number, max: number];

/** Single source for loop timings (seconds unless the name says otherwise). */
export const DOSEY_TIMING = {
  blinkS: {
    sleepy: [3, 5],
    focused: [5, 7],
    relaxed: [3, 5],
    waiting: [3, 5],
    proud: [3, 5],
  } satisfies Record<DoseyMood, Range>,
  /** Slower blinks while Dosey "thinks" (chat streaming). */
  thinkingBlinkS: [5, 8] as Range,
  breathe: {
    sleepy: { scale: 1.02, durationS: 4 },
    deepSleep: { scale: 1.025, durationS: 6 },
    focused: { scale: 1.01, durationS: 5 },
  },
  nodIntervalS: [8, 12] as Range,
  glanceDownIntervalS: [13, 17] as Range,
  glanceWaitingIntervalS: [3.5, 4.5] as Range,
  squintIntervalS: [6, 10] as Range,
  breezeIntervalS: [5, 8] as Range,
  zzzCycleS: 2.4,
  deepZzzCycleS: 4,
  zzzStaggerS: 0.8,
  swaySegmentS: 1.5,
  leafFlutterS: 1.6,
} as const;

export const POKE_COMBO_WINDOW_MS = 1200;
export const POKE_COMBO_COUNT = 3;

/** A value in [min, max) from a 0-1 random source. */
export function pickInRange(range: Range, rand: () => number = Math.random): number {
  return range[0] + rand() * (range[1] - range[0]);
}

/** Which moment (if any) plays when the mood goes from `prev` to `next`. */
export function momentFor(
  prev: DoseyMood | null,
  next: DoseyMood,
  wasDeepAsleep: boolean,
): DoseyMoment | null {
  if (prev === null || prev === next) return null;
  switch (next) {
    case "proud":
      return "celebrate";
    case "sleepy":
      return "doze";
    case "waiting":
      return prev === "focused" || prev === "relaxed" ? "hold" : null;
    case "focused":
      if (prev === "sleepy") return wasDeepAsleep ? "startle" : "wake";
      return prev === "waiting" ? "resume" : null;
    case "relaxed":
      if (prev === "focused" || prev === "sleepy") return "exhale";
      return prev === "waiting" ? "resume" : null;
  }
}

/**
 * Records a poke and reports whether it completes a rapid combo (3 pokes
 * within the window). The history resets once a combo fires.
 */
export function registerPoke(
  history: readonly number[],
  now: number,
): { history: number[]; dizzy: boolean } {
  const recent = history.filter((t) => now - t <= POKE_COMBO_WINDOW_MS);
  recent.push(now);
  if (recent.length >= POKE_COMBO_COUNT) return { history: [], dizzy: true };
  return { history: recent, dizzy: false };
}

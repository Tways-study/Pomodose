import { SETTINGS } from "./settings";
import type { BurnoutLevel, NotificationEvent, TimerStatus } from "@/types";

/** Narrows a NotificationEvent to a BurnoutLevel — used by the counter note
 * to pick its "dosage warning" treatment and by the provider to decide
 * whether a note persists until dismissed instead of auto-clearing. */
export function isBurnoutEvent(event: NotificationEvent): event is BurnoutLevel {
  return event === "overdose" || event === "no-antidote" || event === "long-stretch" || event === "late-hour";
}

function isLateHour(now: number): boolean {
  // Window wraps midnight: [LATE_HOUR_START, 24) union [0, LATE_HOUR_END).
  const hour = new Date(now).getHours();
  return hour >= SETTINGS.LATE_HOUR_START || hour < SETTINGS.LATE_HOUR_END;
}

/**
 * Pure burnout heuristic — no state, no Date.now() inside (now is always
 * passed in so this is deterministic and unit-testable). Returns the single
 * highest-priority hit, in this order: overdose > no-antidote > long-stretch
 * > late-hour. Returns null when none apply.
 */
export function detectBurnout(
  s: { dosesSinceBreak: number; firstDoseAt: number | null; status: TimerStatus },
  now: number,
): BurnoutLevel | null {
  if (s.dosesSinceBreak >= SETTINGS.BURNOUT_DOSES_ALERT) return "overdose";
  if (s.dosesSinceBreak >= SETTINGS.BURNOUT_DOSES_WARN) return "no-antidote";
  if (s.firstDoseAt !== null && now - s.firstDoseAt >= SETTINGS.LONG_STRETCH_MS) return "long-stretch";
  if (s.status === "running" && isLateHour(now)) return "late-hour";
  return null;
}

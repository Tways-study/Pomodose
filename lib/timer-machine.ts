import { SETTINGS } from "./settings";
import type { Phase, TimerState } from "@/types";

function durationFor(phase: Phase): number {
  if (phase === "focus") return SETTINGS.FOCUS_DURATION;
  if (phase === "short") return SETTINGS.SHORT_BREAK;
  return SETTINGS.LONG_BREAK;
}

export type TimerAction =
  | { type: "START" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "RESET" }
  | { type: "TICK" }           // dispatched by a 1s interval in the component
  | { type: "COMPLETE" }
  | { type: "SET_PHASE"; phase: Phase }
  // Seeds the day's counters from persisted sessions on load (see convex/sessions.ts).
  // Counters only — never touches phase/status/remaining, so it can't disturb a
  // session already in flight when the query resolves.
  | { type: "HYDRATE"; dailyDoses: number; focusCycle: number };

export const initialTimerState: TimerState = {
  phase: "focus",
  status: "idle",
  remaining: SETTINGS.FOCUS_DURATION,
  total: SETTINGS.FOCUS_DURATION,
  startedAt: null,
  focusCycle: 0,
  dailyDoses: 0,
  dosesSinceBreak: 0,
  firstDoseAt: null,
};

export function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case "SET_PHASE": {
      const total = durationFor(action.phase);
      return { ...state, phase: action.phase, status: "idle", remaining: total, total, startedAt: null };
    }
    case "START": {
      if (state.status !== "idle") return state;
      const now = Date.now();
      // Marks the very first focus session of this page session — used by
      // the "long-stretch" burnout heuristic. Set once and never overwritten.
      const firstDoseAt =
        state.phase === "focus" && state.firstDoseAt === null ? now : state.firstDoseAt;
      return { ...state, status: "running", startedAt: now, firstDoseAt };
    }

    case "PAUSE":
      if (state.status !== "running") return state;
      return { ...state, status: "paused", startedAt: null };

    case "RESUME":
      if (state.status !== "paused") return state;
      return { ...state, status: "running", startedAt: Date.now() };

    case "RESET": {
      const total = durationFor(state.phase);
      return { ...state, status: "idle", remaining: total, total, startedAt: null };
    }

    case "TICK": {
      // Recalculate remaining from the timestamp delta to stay accurate
      if (state.status !== "running" || state.startedAt === null) return state;
      const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
      const remaining = Math.max(0, state.total - elapsed);
      if (remaining === 0) return state; // let COMPLETE handle it
      return { ...state, remaining };
    }

    case "COMPLETE": {
      if (state.phase === "focus") {
        const focusCycle = state.focusCycle + 1;
        const dailyDoses = state.dailyDoses + 1;
        const dosesSinceBreak = state.dosesSinceBreak + 1;
        const nextPhase: Phase = focusCycle % SETTINGS.CYCLE_LENGTH === 0 ? "long" : "short";
        const total = durationFor(nextPhase);
        return { ...state, phase: nextPhase, status: "idle", remaining: total, total, startedAt: null, focusCycle, dailyDoses, dosesSinceBreak };
      }
      // rest complete → return to focus; a break was taken, so the grind streak resets
      const total = durationFor("focus");
      return { ...state, phase: "focus", status: "idle", remaining: total, total, startedAt: null, dosesSinceBreak: 0 };
    }

    case "HYDRATE":
      return { ...state, dailyDoses: action.dailyDoses, focusCycle: action.focusCycle };

    default:
      return state;
  }
}

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SETTINGS } from "./settings";
import { initialTimerState, timerReducer } from "./timer-machine";
import type { TimerState } from "@/types";

describe("timerReducer", () => {
  it("starts idle in the focus phase with the full focus duration", () => {
    expect(initialTimerState).toMatchObject({
      phase: "focus",
      status: "idle",
      remaining: SETTINGS.FOCUS_DURATION,
      total: SETTINGS.FOCUS_DURATION,
      startedAt: null,
      focusCycle: 0,
      dailyDoses: 0,
      dosesSinceBreak: 0,
      firstDoseAt: null,
    });
  });

  describe("START", () => {
    it("moves idle → running and records startedAt", () => {
      vi.spyOn(Date, "now").mockReturnValue(1000);
      const next = timerReducer(initialTimerState, { type: "START" });
      expect(next.status).toBe("running");
      expect(next.startedAt).toBe(1000);
    });

    it("is a no-op when not idle", () => {
      const running: TimerState = { ...initialTimerState, status: "running" };
      expect(timerReducer(running, { type: "START" })).toBe(running);
    });

    it("sets firstDoseAt once, on the first focus START of the page session", () => {
      vi.spyOn(Date, "now").mockReturnValue(500);
      const next = timerReducer(initialTimerState, { type: "START" });
      expect(next.firstDoseAt).toBe(500);
    });

    it("does not overwrite an existing firstDoseAt on a later START", () => {
      vi.spyOn(Date, "now").mockReturnValue(9999);
      const idleAfterFirstDose: TimerState = { ...initialTimerState, firstDoseAt: 500 };
      const next = timerReducer(idleAfterFirstDose, { type: "START" });
      expect(next.firstDoseAt).toBe(500);
    });

    it("does not set firstDoseAt when starting a break phase", () => {
      vi.spyOn(Date, "now").mockReturnValue(1234);
      const idleOnBreak: TimerState = { ...initialTimerState, phase: "short" };
      const next = timerReducer(idleOnBreak, { type: "START" });
      expect(next.firstDoseAt).toBeNull();
    });
  });

  describe("PAUSE / RESUME", () => {
    it("pauses a running timer and clears startedAt", () => {
      const running: TimerState = { ...initialTimerState, status: "running", startedAt: 5 };
      const next = timerReducer(running, { type: "PAUSE" });
      expect(next.status).toBe("paused");
      expect(next.startedAt).toBeNull();
    });

    it("does not pause when not running", () => {
      expect(timerReducer(initialTimerState, { type: "PAUSE" })).toBe(initialTimerState);
    });

    it("resumes a paused timer back to running", () => {
      vi.spyOn(Date, "now").mockReturnValue(42);
      const paused: TimerState = { ...initialTimerState, status: "paused" };
      const next = timerReducer(paused, { type: "RESUME" });
      expect(next.status).toBe("running");
      expect(next.startedAt).toBe(42);
    });

    it("does not resume when not paused", () => {
      expect(timerReducer(initialTimerState, { type: "RESUME" })).toBe(initialTimerState);
    });
  });

  describe("SET_PHASE", () => {
    it("switches phase and resets remaining/total to that phase's duration", () => {
      const next = timerReducer(initialTimerState, { type: "SET_PHASE", phase: "long" });
      expect(next.phase).toBe("long");
      expect(next.status).toBe("idle");
      expect(next.remaining).toBe(SETTINGS.LONG_BREAK);
      expect(next.total).toBe(SETTINGS.LONG_BREAK);
      expect(next.startedAt).toBeNull();
    });
  });

  describe("RESET", () => {
    it("returns the current phase to idle with a full duration", () => {
      const dirty: TimerState = {
        ...initialTimerState,
        phase: "short",
        status: "running",
        remaining: 3,
        total: SETTINGS.SHORT_BREAK,
        startedAt: 99,
      };
      const next = timerReducer(dirty, { type: "RESET" });
      expect(next.status).toBe("idle");
      expect(next.remaining).toBe(SETTINGS.SHORT_BREAK);
      expect(next.startedAt).toBeNull();
    });
  });

  describe("TICK", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("recomputes remaining from the startedAt delta", () => {
      vi.setSystemTime(0);
      const running: TimerState = {
        ...initialTimerState,
        status: "running",
        startedAt: Date.now(),
      };
      vi.setSystemTime(10_000); // 10s later
      const next = timerReducer(running, { type: "TICK" });
      expect(next.remaining).toBe(SETTINGS.FOCUS_DURATION - 10);
    });

    it("is a no-op when not running", () => {
      expect(timerReducer(initialTimerState, { type: "TICK" })).toBe(initialTimerState);
    });
  });

  describe("COMPLETE", () => {
    it("advances focus → short break and increments cycle + daily dose", () => {
      const next = timerReducer(initialTimerState, { type: "COMPLETE" });
      expect(next.phase).toBe("short");
      expect(next.focusCycle).toBe(1);
      expect(next.dailyDoses).toBe(1);
      expect(next.remaining).toBe(SETTINGS.SHORT_BREAK);
    });

    it("increments dosesSinceBreak across consecutive focus completions", () => {
      const first = timerReducer(initialTimerState, { type: "COMPLETE" });
      expect(first.dosesSinceBreak).toBe(1);

      // Simulate completing another focus session without an intervening break.
      const backToFocus: TimerState = { ...first, phase: "focus" };
      const second = timerReducer(backToFocus, { type: "COMPLETE" });
      expect(second.dosesSinceBreak).toBe(2);
    });

    it("resets dosesSinceBreak to 0 when a break completes", () => {
      const onBreakAfterStreak: TimerState = { ...initialTimerState, phase: "short", dosesSinceBreak: 3 };
      const next = timerReducer(onBreakAfterStreak, { type: "COMPLETE" });
      expect(next.dosesSinceBreak).toBe(0);
    });

    it("advances to a long break after every CYCLE_LENGTH focus sessions", () => {
      const beforeLong: TimerState = {
        ...initialTimerState,
        focusCycle: SETTINGS.CYCLE_LENGTH - 1,
      };
      const next = timerReducer(beforeLong, { type: "COMPLETE" });
      expect(next.focusCycle).toBe(SETTINGS.CYCLE_LENGTH);
      expect(next.phase).toBe("long");
      expect(next.remaining).toBe(SETTINGS.LONG_BREAK);
    });

    it("returns to focus after a break completes", () => {
      const onBreak: TimerState = { ...initialTimerState, phase: "short", dailyDoses: 2 };
      const next = timerReducer(onBreak, { type: "COMPLETE" });
      expect(next.phase).toBe("focus");
      expect(next.remaining).toBe(SETTINGS.FOCUS_DURATION);
      expect(next.dailyDoses).toBe(2); // breaks do not add a dose
    });
  });

  describe("HYDRATE", () => {
    it("seeds the day's counters from persisted sessions", () => {
      const next = timerReducer(initialTimerState, {
        type: "HYDRATE",
        dailyDoses: 5,
        focusCycle: 5,
      });
      expect(next.dailyDoses).toBe(5);
      expect(next.focusCycle).toBe(5);
    });

    it("leaves the cycle position consistent with the hydrated count", () => {
      const next = timerReducer(initialTimerState, {
        type: "HYDRATE",
        dailyDoses: SETTINGS.CYCLE_LENGTH + 1,
        focusCycle: SETTINGS.CYCLE_LENGTH + 1,
      });
      expect(next.focusCycle % SETTINGS.CYCLE_LENGTH).toBe(1);
    });

    it("does not disturb a session already in flight", () => {
      const running: TimerState = {
        ...initialTimerState,
        status: "running",
        startedAt: Date.now(),
        remaining: 900,
      };
      const next = timerReducer(running, { type: "HYDRATE", dailyDoses: 3, focusCycle: 3 });
      expect(next.status).toBe("running");
      expect(next.startedAt).toBe(running.startedAt);
      expect(next.remaining).toBe(900);
      expect(next.phase).toBe(running.phase);
      expect(next.dailyDoses).toBe(3);
    });

    it("hydrating to zero is a no-op on the counters", () => {
      const next = timerReducer(initialTimerState, {
        type: "HYDRATE",
        dailyDoses: 0,
        focusCycle: 0,
      });
      expect(next.dailyDoses).toBe(0);
      expect(next.focusCycle).toBe(0);
    });
  });
});

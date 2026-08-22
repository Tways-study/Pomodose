import { describe, expect, it } from "vitest";
import { detectBurnout, isBurnoutEvent } from "./burnout";
import { SETTINGS } from "./settings";

// All "now" values are built from local date-time components (not UTC), so
// the local-hour check inside detectBurnout is exercised consistently
// regardless of the machine/CI runner's timezone.
function localTime(hour: number, minute = 0): number {
  return new Date(2026, 2, 10, hour, minute, 0).getTime();
}

describe("detectBurnout", () => {
  it("returns null when nothing is off", () => {
    const level = detectBurnout(
      { dosesSinceBreak: 0, firstDoseAt: null, status: "idle" },
      localTime(12),
    );
    expect(level).toBeNull();
  });

  it("fires no-antidote once dosesSinceBreak reaches the warn threshold", () => {
    const level = detectBurnout(
      { dosesSinceBreak: SETTINGS.BURNOUT_DOSES_WARN, firstDoseAt: null, status: "idle" },
      localTime(12),
    );
    expect(level).toBe("no-antidote");
  });

  it("does not fire no-antidote below the warn threshold", () => {
    const level = detectBurnout(
      { dosesSinceBreak: SETTINGS.BURNOUT_DOSES_WARN - 1, firstDoseAt: null, status: "idle" },
      localTime(12),
    );
    expect(level).toBeNull();
  });

  it("fires overdose once dosesSinceBreak reaches the alert threshold", () => {
    const level = detectBurnout(
      { dosesSinceBreak: SETTINGS.BURNOUT_DOSES_ALERT, firstDoseAt: null, status: "idle" },
      localTime(12),
    );
    expect(level).toBe("overdose");
  });

  it("fires long-stretch once firstDoseAt is at least LONG_STRETCH_MS in the past", () => {
    const start = localTime(9);
    const level = detectBurnout(
      { dosesSinceBreak: 0, firstDoseAt: start, status: "idle" },
      start + SETTINGS.LONG_STRETCH_MS,
    );
    expect(level).toBe("long-stretch");
  });

  it("does not fire long-stretch before the threshold elapses", () => {
    const start = localTime(9);
    const level = detectBurnout(
      { dosesSinceBreak: 0, firstDoseAt: start, status: "idle" },
      start + SETTINGS.LONG_STRETCH_MS - 1000,
    );
    expect(level).toBeNull();
  });

  it("fires late-hour only while running, inside the late window", () => {
    const running = detectBurnout(
      { dosesSinceBreak: 0, firstDoseAt: null, status: "running" },
      localTime(23, 30),
    );
    expect(running).toBe("late-hour");

    const idle = detectBurnout(
      { dosesSinceBreak: 0, firstDoseAt: null, status: "idle" },
      localTime(23, 30),
    );
    expect(idle).toBeNull();
  });

  it("wraps the late-hour window across midnight", () => {
    const base = { dosesSinceBreak: 0, firstDoseAt: null, status: "running" as const };
    expect(detectBurnout(base, localTime(23))).toBe("late-hour");   // start boundary, inclusive
    expect(detectBurnout(base, localTime(0))).toBe("late-hour");    // just after midnight
    expect(detectBurnout(base, localTime(3, 59))).toBe("late-hour"); // just before end
    expect(detectBurnout(base, localTime(4))).toBeNull();           // end boundary, exclusive
    expect(detectBurnout(base, localTime(22, 59))).toBeNull();      // just before start
  });

  it("prioritizes overdose over no-antidote, long-stretch, and late-hour", () => {
    const start = localTime(9);
    const level = detectBurnout(
      { dosesSinceBreak: SETTINGS.BURNOUT_DOSES_ALERT, firstDoseAt: start, status: "running" },
      start + SETTINGS.LONG_STRETCH_MS,
    );
    expect(level).toBe("overdose");
  });

  it("prioritizes no-antidote over long-stretch and late-hour", () => {
    const start = localTime(9);
    const level = detectBurnout(
      { dosesSinceBreak: SETTINGS.BURNOUT_DOSES_WARN, firstDoseAt: start, status: "running" },
      start + SETTINGS.LONG_STRETCH_MS,
    );
    expect(level).toBe("no-antidote");
  });

  it("prioritizes long-stretch over late-hour", () => {
    const start = localTime(20);
    const level = detectBurnout(
      { dosesSinceBreak: 0, firstDoseAt: start, status: "running" },
      start + SETTINGS.LONG_STRETCH_MS, // lands at 00:00, inside the late-hour window too
    );
    expect(level).toBe("long-stretch");
  });
});

describe("isBurnoutEvent", () => {
  it("recognizes the four burnout events", () => {
    expect(isBurnoutEvent("overdose")).toBe(true);
    expect(isBurnoutEvent("no-antidote")).toBe(true);
    expect(isBurnoutEvent("long-stretch")).toBe(true);
    expect(isBurnoutEvent("late-hour")).toBe(true);
  });

  it("rejects non-burnout events", () => {
    expect(isBurnoutEvent("focus-complete")).toBe(false);
    expect(isBurnoutEvent("first-dose")).toBe(false);
    expect(isBurnoutEvent("goals-cleared")).toBe(false);
  });
});

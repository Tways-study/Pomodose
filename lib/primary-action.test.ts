import { describe, expect, it } from "vitest";
import { primaryAction } from "./primary-action";
import { initialTimerState } from "./timer-machine";
import type { TimerState } from "@/types";

const withStatus = (status: TimerState["status"], phase: TimerState["phase"] = "focus"): TimerState => ({
  ...initialTimerState,
  status,
  phase,
});

describe("primaryAction", () => {
  it("pauses while running", () => {
    expect(primaryAction(withStatus("running"))).toEqual({
      label: "Pause",
      action: { type: "PAUSE" },
      icon: "pause",
    });
  });

  it("resumes while paused", () => {
    expect(primaryAction(withStatus("paused"))).toEqual({
      label: "Resume",
      action: { type: "RESUME" },
      icon: "play",
    });
  });

  it("begins the current phase when idle", () => {
    expect(primaryAction(withStatus("idle", "focus"))).toMatchObject({ label: "Begin dose", action: { type: "START" }, icon: "play" });
    expect(primaryAction(withStatus("idle", "short")).label).toBe("Begin refill");
    expect(primaryAction(withStatus("idle", "long")).label).toBe("Begin antidote");
  });

  it("treats complete like idle", () => {
    expect(primaryAction(withStatus("complete")).action).toEqual({ type: "START" });
  });
});

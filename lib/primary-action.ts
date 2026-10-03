import type { TimerState } from "@/types";
import type { TimerAction } from "@/lib/timer-machine";
import { PHASE_LABEL } from "@/lib/timer-format";

export interface PrimaryAction {
  label: string;
  action: TimerAction;
  icon: "play" | "pause";
}

// The single start/pause/resume control shared by the vial and the sticky bar.
export function primaryAction(state: TimerState): PrimaryAction {
  if (state.status === "running") {
    return { label: "Pause", action: { type: "PAUSE" }, icon: "pause" };
  }
  if (state.status === "paused") {
    return { label: "Resume", action: { type: "RESUME" }, icon: "play" };
  }
  return {
    label: `Begin ${PHASE_LABEL[state.phase].toLowerCase()}`,
    action: { type: "START" },
    icon: "play",
  };
}

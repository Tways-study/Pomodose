import type { Phase, TimerStatus } from "@/types";

export type DoseyMood = "sleepy" | "focused" | "relaxed" | "proud";

export function doseyMoodFor(input: {
  phase: Phase;
  status: TimerStatus;
  justCompleted: boolean;
}): DoseyMood {
  if (input.justCompleted) return "proud";
  if (input.status === "running") {
    return input.phase === "focus" ? "focused" : "relaxed";
  }
  if (input.status === "paused") return "relaxed";
  return "sleepy";
}

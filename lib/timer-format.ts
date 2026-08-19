import type { Phase } from "@/types";

export const PHASE_LABEL: Record<Phase, string> = {
  focus: "Dose",
  short: "Refill",
  long: "Antidote",
};

export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mm = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

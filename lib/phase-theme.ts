import type { Phase } from "@/types";

// Phase-linked accent for running-state chrome (page wash, header sweep,
// dashboard-card glow, active-tab dot, dose-ring). The vial itself keeps
// its fixed lilac and is not driven by this table.
export const PHASE_ACCENT: Record<Phase, { base: string; deep: string; tint: string }> = {
  focus: { base: "#C9B6E4", deep: "#9B7FC4", tint: "#C9B6E422" },
  short: { base: "#D9B36B", deep: "#B98A3E", tint: "#D9B36B22" },
  long:  { base: "#D9B36B", deep: "#B98A3E", tint: "#D9B36B22" },
};

// Running-state card shadow: 1px accent hairline plus a wide, soft glow. Used
// by every card that reacts to the running phase so the treatment stays in one
// place. `deep` gets a hex alpha suffix (e.g. "88" is roughly 53%).
export function runningShadow(accent: { base: string; deep: string }): string {
  return [
    "0 1px 0 rgba(255,255,255,.7) inset",
    `0 0 0 1px ${accent.base}`,
    `0 18px 44px -14px ${accent.deep}66`,
  ].join(", ");
}

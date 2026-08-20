import type { Phase } from "@/types";

// Phase-linked accent for running-state chrome (page wash, header sweep,
// dashboard-card glow, active-tab dot, dose-ring). The vial itself keeps
// its fixed lilac and is not driven by this table.
export const PHASE_ACCENT: Record<Phase, { base: string; deep: string; tint: string }> = {
  focus: { base: "#C9B6E4", deep: "#9B7FC4", tint: "#C9B6E422" },
  short: { base: "#D9B36B", deep: "#B98A3E", tint: "#D9B36B22" },
  long:  { base: "#D9B36B", deep: "#B98A3E", tint: "#D9B36B22" },
};

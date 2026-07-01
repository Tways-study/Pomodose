import { describe, expect, it } from "vitest";
import { buildContextBlock } from "./dosey";
import type { DoseyStats, Goal } from "@/types";

const baseStats: DoseyStats = {
  dailyDoses: 3,
  cyclePosition: 2,
  cycleLength: 4,
  phase: "focus",
  status: "running",
};

const goals: Goal[] = [
  { id: "1", text: "Review pharmacokinetics", done: true, createdAt: 1 },
  { id: "2", text: "Practice IV calculations", done: false, createdAt: 2 },
];

describe("buildContextBlock", () => {
  it("includes the dose count", () => {
    expect(buildContextBlock(baseStats, [])).toContain("completed today: 3");
  });

  it("includes cycle progress toward the long break", () => {
    expect(buildContextBlock(baseStats, [])).toContain(
      "2 of 4 focus sessions toward the next long break",
    );
  });

  it("labels the current phase and timer status", () => {
    expect(buildContextBlock(baseStats, [])).toContain("Focus (timer running)");
  });

  it("lists goal titles with their done state and a done/total count", () => {
    const block = buildContextBlock(baseStats, goals);
    expect(block).toContain("Today's goals (1/2 done):");
    expect(block).toContain("[x] Review pharmacokinetics");
    expect(block).toContain("[ ] Practice IV calculations");
  });

  it("reads sensibly when there are no goals", () => {
    const block = buildContextBlock(baseStats, []);
    expect(block).toContain("Today's goals: none added yet.");
    expect(block).not.toContain("[ ]");
  });
});

import { describe, expect, it } from "vitest";
import { doseyMoodFor } from "./dosey-mood";

describe("doseyMoodFor", () => {
  it("is proud right after a completion, whatever the timer says", () => {
    expect(doseyMoodFor({ phase: "focus", status: "idle", justCompleted: true })).toBe("proud");
    expect(doseyMoodFor({ phase: "long", status: "running", justCompleted: true })).toBe("proud");
  });

  it("is focused while a focus session runs", () => {
    expect(doseyMoodFor({ phase: "focus", status: "running", justCompleted: false })).toBe("focused");
  });

  it("is relaxed during running breaks", () => {
    expect(doseyMoodFor({ phase: "short", status: "running", justCompleted: false })).toBe("relaxed");
    expect(doseyMoodFor({ phase: "long", status: "running", justCompleted: false })).toBe("relaxed");
  });

  it("is relaxed when paused", () => {
    expect(doseyMoodFor({ phase: "focus", status: "paused", justCompleted: false })).toBe("relaxed");
  });

  it("is sleepy when idle or complete", () => {
    expect(doseyMoodFor({ phase: "focus", status: "idle", justCompleted: false })).toBe("sleepy");
    expect(doseyMoodFor({ phase: "short", status: "complete", justCompleted: false })).toBe("sleepy");
  });
});

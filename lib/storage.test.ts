import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadGoals, saveGoals } from "./storage";
import type { Goal } from "@/types";

const STORAGE_KEY = "apothecary_goals";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

const sampleGoals: Goal[] = [
  { id: "1", text: "Write tests", done: false, createdAt: 1 },
  { id: "2", text: "Ship CI", done: true, createdAt: 2 },
];

describe("goal storage", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("returns an empty array when nothing is stored", () => {
    expect(loadGoals()).toEqual([]);
  });

  it("round-trips saved goals within the same day", () => {
    saveGoals(sampleGoals);
    expect(loadGoals()).toEqual(sampleGoals);
  });

  it("stamps the payload with today's date", () => {
    saveGoals(sampleGoals);
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(raw.date).toBe(todayKey());
  });

  it("rolls over: stale-dated goals are dropped", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date: "2000-01-01", goals: sampleGoals }),
    );
    expect(loadGoals()).toEqual([]);
  });

  it("returns empty on malformed JSON", () => {
    localStorage.setItem(STORAGE_KEY, "not json {");
    expect(loadGoals()).toEqual([]);
  });

  it("returns empty when the stored shape fails validation", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date: todayKey(), goals: [{ id: 5, text: "bad" }] }),
    );
    expect(loadGoals()).toEqual([]);
  });
});

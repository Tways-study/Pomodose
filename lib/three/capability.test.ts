import { describe, expect, it } from "vitest";
import { isLowEndDevice } from "./capability";

describe("isLowEndDevice", () => {
  it("treats a browser that exposes nothing as capable", () => {
    expect(isLowEndDevice({})).toBe(false);
  });

  it("flags data saver", () => {
    expect(isLowEndDevice({ saveData: true })).toBe(true);
  });

  it("flags 2 GB or less of memory, but not 4 GB", () => {
    expect(isLowEndDevice({ deviceMemory: 2 })).toBe(true);
    expect(isLowEndDevice({ deviceMemory: 4 })).toBe(false);
  });

  it("flags two cores or fewer, but not four", () => {
    expect(isLowEndDevice({ hardwareConcurrency: 2 })).toBe(true);
    expect(isLowEndDevice({ hardwareConcurrency: 4 })).toBe(false);
  });
});

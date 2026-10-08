import { describe, expect, it } from "vitest";
import { isLowEndDevice } from "./capability";

describe("isLowEndDevice", () => {
  it("treats a browser that exposes nothing as capable", () => {
    expect(isLowEndDevice({})).toBe(false);
  });

  it("flags data saver only", () => {
    expect(isLowEndDevice({ saveData: true })).toBe(true);
    expect(isLowEndDevice({ saveData: false })).toBe(false);
  });
});

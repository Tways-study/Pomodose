import { describe, expect, it } from "vitest";
import { generateOtpCode } from "./generateOtpCode";

describe("generateOtpCode", () => {
  it("returns a 6-digit numeric string", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateOtpCode();
      expect(code).toMatch(/^\d{6}$/);
    }
  });

  it("stays within the 100000-999999 range", () => {
    for (let i = 0; i < 50; i++) {
      const code = Number(generateOtpCode());
      expect(code).toBeGreaterThanOrEqual(100000);
      expect(code).toBeLessThanOrEqual(999999);
    }
  });
});

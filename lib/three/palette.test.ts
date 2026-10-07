import { describe, expect, it } from "vitest";
import { PALETTE } from "./palette";

describe("PALETTE", () => {
  it("resolves every tone to a hex color from the Tailwind theme", () => {
    for (const hex of Object.values(PALETTE)) expect(hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});

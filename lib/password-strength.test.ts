import { describe, expect, it } from "vitest";
import { assessPasswordStrength } from "./password-strength";

describe("assessPasswordStrength", () => {
  it("scores an empty password as weak with no label", () => {
    const result = assessPasswordStrength("");
    expect(result).toEqual({ level: "weak", score: 0, label: "" });
  });

  it("scores a short single-case password as weak", () => {
    const result = assessPasswordStrength("abcxyz");
    expect(result.level).toBe("weak");
    expect(result.score).toBe(0);
  });

  it("scores a short single-variety password as weak even past the 8-char floor", () => {
    const result = assessPasswordStrength("kqxjzmwbtf");
    expect(result.level).toBe("weak");
    expect(result.score).toBe(1);
  });

  it("scores a 12+ char single-variety password as fair", () => {
    const result = assessPasswordStrength("kqxjzmwbtfhr");
    expect(result.level).toBe("fair");
    expect(result.score).toBe(2);
  });

  it("scores a 12+ char password with three character classes as good or better", () => {
    const result = assessPasswordStrength("Kx9qWm7zJr4T");
    expect(result.score).toBeGreaterThanOrEqual(3);
    expect(["good", "strong"]).toContain(result.level);
  });

  it("scores a long, varied password as strong", () => {
    const result = assessPasswordStrength("Tincture&Vial#2091!");
    expect(result.level).toBe("strong");
    expect(result.score).toBe(4);
  });

  it("penalizes a repeated character regardless of length", () => {
    const result = assessPasswordStrength("aaaaaaaaaaaaaaaa");
    expect(result.level).toBe("weak");
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it("penalizes a sequential alphabet run even when long", () => {
    const result = assessPasswordStrength("abcdefghijklmnop");
    expect(result.level).toBe("weak");
  });

  it("penalizes a sequential digit run", () => {
    const result = assessPasswordStrength("123456789012");
    expect(result.level).toBe("weak");
  });

  it("penalizes a reversed sequential run", () => {
    const result = assessPasswordStrength("ponmlkjihgfedcba");
    expect(result.level).toBe("weak");
  });

  it("detects a keyboard-row run embedded in a longer password", () => {
    const result = assessPasswordStrength("myqwertyuiopPass1");
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it("returns a themed, non-empty label for every non-empty password", () => {
    for (const pw of ["a", "abcdefgh", "Abcdefgh1", "Tincture&Vial#2091!"]) {
      expect(assessPasswordStrength(pw).label.length).toBeGreaterThan(0);
    }
  });
});

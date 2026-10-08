import { describe, expect, it, vi } from "vitest";
import { resolveAuthed, tokenIsLive, type Verdict } from "./auth-gate";

function jwt(payload: object): string {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${b64({ alg: "RS256" })}.${b64(payload)}.signature`;
}

const NOW = 1_800_000_000_000;

describe("tokenIsLive", () => {
  it("is true before exp and false at or after it", () => {
    expect(tokenIsLive(jwt({ exp: NOW / 1000 + 60 }), NOW)).toBe(true);
    expect(tokenIsLive(jwt({ exp: NOW / 1000 }), NOW)).toBe(false);
    expect(tokenIsLive(jwt({ exp: NOW / 1000 - 60 }), NOW)).toBe(false);
  });

  it("is false for missing, malformed or exp-less tokens", () => {
    expect(tokenIsLive(null, NOW)).toBe(false);
    expect(tokenIsLive("", NOW)).toBe(false);
    expect(tokenIsLive("not-a-jwt", NOW)).toBe(false);
    expect(tokenIsLive("a.%%%.c", NOW)).toBe(false);
    expect(tokenIsLive(jwt({ sub: "x" }), NOW)).toBe(false);
  });
});

describe("resolveAuthed", () => {
  const live = jwt({ exp: NOW / 1000 + 3600 });
  const dead = jwt({ exp: NOW / 1000 - 3600 });
  const verifyReturning = (...verdicts: Verdict[]) => {
    const fn = vi.fn<(t: string) => Promise<Verdict>>();
    verdicts.forEach((v) => fn.mockResolvedValueOnce(v));
    return fn;
  };

  it("is false without a token and never asks the backend", async () => {
    const verify = verifyReturning("yes");
    expect(await resolveAuthed(undefined, verify, NOW)).toBe(false);
    expect(verify).not.toHaveBeenCalled();
  });

  it("trusts a definite yes or no, even over the token's own expiry", async () => {
    expect(await resolveAuthed(dead, verifyReturning("yes"), NOW)).toBe(true);
    expect(await resolveAuthed(live, verifyReturning("no"), NOW)).toBe(false);
  });

  it("retries once when the backend cannot answer, then accepts the answer", async () => {
    const verify = verifyReturning("unknown", "yes");
    expect(await resolveAuthed(live, verify, NOW)).toBe(true);
    expect(verify).toHaveBeenCalledTimes(2);
  });

  it("falls back to token liveness when the backend never answers", async () => {
    expect(await resolveAuthed(live, verifyReturning("unknown", "unknown"), NOW)).toBe(true);
    expect(await resolveAuthed(dead, verifyReturning("unknown", "unknown"), NOW)).toBe(false);
  });
});

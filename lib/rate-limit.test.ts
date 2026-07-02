import { describe, expect, it } from "vitest";
import {
  DAILY_MESSAGE_LIMIT,
  consumeRateLimit,
  dayKey,
  evaluateRateLimit,
  getClientIp,
  type RateLimitEntry,
} from "./rate-limit";

describe("dayKey", () => {
  it("formats as YYYY-MM-DD in UTC, matching lib/storage.ts's todayKey()", () => {
    expect(dayKey(new Date("2026-03-05T23:59:59.000Z"))).toBe("2026-03-05");
    expect(dayKey(new Date("2026-03-06T00:00:00.000Z"))).toBe("2026-03-06");
  });
});

describe("evaluateRateLimit", () => {
  const now = new Date("2026-03-05T12:00:00.000Z");

  it("allows the first request of the day with no prior entry", () => {
    const { result, nextEntry } = evaluateRateLimit(undefined, now);
    expect(result).toEqual({
      allowed: true,
      remaining: DAILY_MESSAGE_LIMIT - 1,
      resetAt: "2026-03-06T00:00:00.000Z",
    });
    expect(nextEntry).toEqual({ day: "2026-03-05", count: 1 });
  });

  it("increments an existing same-day entry", () => {
    const entry: RateLimitEntry = { day: "2026-03-05", count: 10 };
    const { result, nextEntry } = evaluateRateLimit(entry, now);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(DAILY_MESSAGE_LIMIT - 11);
    expect(nextEntry.count).toBe(11);
  });

  it("allows exactly the 30th message", () => {
    const entry: RateLimitEntry = { day: "2026-03-05", count: DAILY_MESSAGE_LIMIT - 1 };
    const { result } = evaluateRateLimit(entry, now);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("blocks the 31st same-day request", () => {
    const entry: RateLimitEntry = { day: "2026-03-05", count: DAILY_MESSAGE_LIMIT };
    const { result, nextEntry } = evaluateRateLimit(entry, now);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(nextEntry).toEqual({ day: "2026-03-05", count: DAILY_MESSAGE_LIMIT });
  });

  it("resets the count when the stored entry's day differs, even if it was maxed out", () => {
    const staleEntry: RateLimitEntry = { day: "2026-03-04", count: DAILY_MESSAGE_LIMIT };
    const { result, nextEntry } = evaluateRateLimit(staleEntry, now);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(DAILY_MESSAGE_LIMIT - 1);
    expect(nextEntry).toEqual({ day: "2026-03-05", count: 1 });
  });

  it("resetAt is always the next UTC midnight regardless of allowed/blocked", () => {
    const early = evaluateRateLimit(undefined, new Date("2026-03-05T00:00:01.000Z"));
    const late = evaluateRateLimit(undefined, new Date("2026-03-05T23:59:59.000Z"));
    expect(early.result.resetAt).toBe("2026-03-06T00:00:00.000Z");
    expect(late.result.resetAt).toBe("2026-03-06T00:00:00.000Z");
  });
});

describe("consumeRateLimit", () => {
  it("tracks independent quotas per key", () => {
    const ipA = `test-ip-a-${Math.random()}`;
    const ipB = `test-ip-b-${Math.random()}`;
    const now = new Date("2026-03-05T12:00:00.000Z");

    const a1 = consumeRateLimit(ipA, now);
    const b1 = consumeRateLimit(ipB, now);
    expect(a1.remaining).toBe(DAILY_MESSAGE_LIMIT - 1);
    expect(b1.remaining).toBe(DAILY_MESSAGE_LIMIT - 1);

    const a2 = consumeRateLimit(ipA, now);
    expect(a2.remaining).toBe(DAILY_MESSAGE_LIMIT - 2);
  });

  it("blocks once a key exceeds the daily limit", () => {
    const ip = `test-ip-block-${Math.random()}`;
    const now = new Date("2026-03-05T12:00:00.000Z");
    let last;
    for (let i = 0; i < DAILY_MESSAGE_LIMIT + 1; i++) {
      last = consumeRateLimit(ip, now);
    }
    expect(last).toEqual({ allowed: false, remaining: 0, resetAt: "2026-03-06T00:00:00.000Z" });
  });
});

describe("getClientIp", () => {
  it("uses the first IP from a comma-separated x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" });
    expect(getClientIp(headers)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const headers = new Headers({ "x-real-ip": "198.51.100.7" });
    expect(getClientIp(headers)).toBe("198.51.100.7");
  });

  it("falls back to a shared unknown bucket when neither header is present", () => {
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});

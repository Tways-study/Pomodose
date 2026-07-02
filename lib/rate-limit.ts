export const DAILY_MESSAGE_LIMIT = 30;

export interface RateLimitEntry {
  day: string; // "YYYY-MM-DD", same UTC-based key as lib/storage.ts's todayKey()
  count: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number; // messages left today (0 when blocked)
  resetAt: string; // ISO instant of the next day-key rollover
}

export function dayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10); // mirrors lib/storage.ts's todayKey()
}

function nextRolloverIso(now: Date): string {
  const next = new Date(now);
  next.setUTCDate(next.getUTCDate() + 1);
  next.setUTCHours(0, 0, 0, 0);
  return next.toISOString();
}

/**
 * Pure decision function: given the last known entry for a key (or none)
 * and the current time, decides whether to allow this request and what the
 * entry should become. No module state touched — testable like timerReducer.
 */
export function evaluateRateLimit(
  entry: RateLimitEntry | undefined,
  now: Date = new Date(),
): { result: RateLimitResult; nextEntry: RateLimitEntry } {
  const today = dayKey(now);
  const current = entry?.day === today ? entry.count : 0;
  const resetAt = nextRolloverIso(now);

  if (current >= DAILY_MESSAGE_LIMIT) {
    return {
      result: { allowed: false, remaining: 0, resetAt },
      nextEntry: { day: today, count: current },
    };
  }

  const count = current + 1;
  return {
    result: { allowed: true, remaining: DAILY_MESSAGE_LIMIT - count, resetAt },
    nextEntry: { day: today, count },
  };
}

// Stateful wrapper — the only impure export, used by the API route. Resets
// naturally on server restart/redeploy; on serverless multi-instance hosting
// the effective quota is per-instance, not global. Accepted for this
// personal project's scale (no database/Redis available).
const store = new Map<string, RateLimitEntry>();

export function consumeRateLimit(ip: string, now: Date = new Date()): RateLimitResult {
  const { result, nextEntry } = evaluateRateLimit(store.get(ip), now);
  store.set(ip, nextEntry);
  return result;
}

/**
 * Best-effort client identifier from standard Fetch API headers. Falls back
 * to a shared "unknown" bucket (fail-safe, not fail-open) when there's no
 * reverse proxy in front to set forwarding headers — e.g. local dev.
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  const first = forwardedFor?.split(",")[0]?.trim();
  if (first) return first;
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

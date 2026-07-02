import { z } from "zod";
import type { DoseyRateLimitState } from "@/types";

const RateLimitStateSchema = z.object({
  resetAt: z.string(),
});

const STORAGE_KEY = "apothecary_dosey_limited_until";

/**
 * Reads the persisted "Dosey is resting" state. Returns null when nothing is
 * stored, the data is malformed, or resetAt has already passed — that last
 * check is the entire "Dosey silently notifies you when she's back"
 * mechanism: once the instant has passed, loading acts exactly like never
 * having been limited at all, no explicit clear step required.
 */
export function loadRateLimit(): DoseyRateLimitState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = RateLimitStateSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    if (new Date(parsed.data.resetAt).getTime() <= Date.now()) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function saveRateLimit(resetAt: string): void {
  if (typeof window === "undefined") return;
  const payload: DoseyRateLimitState = { resetAt };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

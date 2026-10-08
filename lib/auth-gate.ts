/** What the backend said about a token: "unknown" means we could not reach a verdict (timeout, network, 5xx). */
export type Verdict = "yes" | "no" | "unknown";

/** Reads `exp` from a JWT without verifying it. False for anything malformed. */
export function tokenIsLive(token: string | null | undefined, nowMs: number): boolean {
  if (!token) return false;
  const payload = token.split(".")[1];
  if (!payload) return false;
  try {
    const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
    const { exp } = JSON.parse(json) as { exp?: unknown };
    return typeof exp === "number" && exp * 1000 > nowMs;
  } catch {
    return false;
  }
}

/**
 * Whether to treat the request as signed in. The backend's answer wins when it gives
 * one; when it cannot answer (after `retries` more tries) a token that has not
 * expired is trusted, so a network blip never bounces a signed-in user to /login.
 * Data stays protected either way: every Convex function checks the token itself.
 */
export async function resolveAuthed(
  token: string | null | undefined,
  verify: (token: string) => Promise<Verdict>,
  nowMs: number,
  retries = 1,
): Promise<boolean> {
  if (!token) return false;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const verdict = await verify(token);
    if (verdict === "yes") return true;
    if (verdict === "no") return false;
  }
  return tokenIsLive(token, nowMs);
}

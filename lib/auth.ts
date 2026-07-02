import { createHash, createHmac, timingSafeEqual } from "crypto";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";

// Next.js's Proxy, Route Handlers, and Server Components are each built as
// separate bundles and do NOT reliably share in-memory module state — the
// Next.js docs say so explicitly for Proxy ("you should not attempt relying
// on shared modules or globals"), and it holds true for Route Handlers vs.
// Server Components too. So the access-code hash is persisted to a small
// JSON file instead of a module-level variable, and session validity is a
// stateless HMAC signature (verifiable independently in any context from
// the token alone + the file-derived secret) rather than a server-side
// session store. No database — this project doesn't have one.
const STORE_PATH = join(process.cwd(), ".pomodose-auth.json");

export const SESSION_COOKIE = "pomodose_session";
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface AuthFile {
  codeHash: string;
}

/** Pure — deterministic, no I/O. */
export function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/** Pure, constant-time comparison of two equal-length hex strings. */
export function hashesMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

function readStore(): AuthFile | null {
  try {
    if (!existsSync(STORE_PATH)) return null;
    const raw = JSON.parse(readFileSync(STORE_PATH, "utf-8"));
    return typeof raw?.codeHash === "string" ? { codeHash: raw.codeHash } : null;
  } catch {
    return null;
  }
}

function writeStore(data: AuthFile): void {
  writeFileSync(STORE_PATH, JSON.stringify(data), "utf-8");
}

export function hasAccessCode(): boolean {
  return readStore() !== null;
}

export function registerAccessCode(code: string): void {
  writeStore({ codeHash: hashCode(code) });
}

export function verifyAccessCode(code: string): boolean {
  const store = readStore();
  if (!store) return false;
  return hashesMatch(hashCode(code), store.codeHash);
}

// The session-signing secret is derived from the registered code's hash, so
// every context (Route Handler, Proxy, Server Component) reaches the same
// secret independently just by reading the same file — no shared process
// memory required, and it survives server restarts (unlike a random
// per-process secret would).
function getSessionSecret(): string | null {
  const store = readStore();
  if (!store) return null;
  return hashCode(`${store.codeHash}:pomodose-session-secret`);
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/** Returns null if no access code is registered yet (nothing to sign against). */
export function createSessionToken(): string | null {
  const secret = getSessionSecret();
  if (!secret) return null;
  const issuedAt = Date.now().toString();
  return `${issuedAt}.${sign(issuedAt, secret)}`;
}

export function isValidSession(token: string | undefined | null): boolean {
  if (!token) return false;
  const secret = getSessionSecret();
  if (!secret) return false;

  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) return false;

  const expected = sign(issuedAt, secret);
  if (!hashesMatch(signature, expected)) return false;

  const age = Date.now() - Number(issuedAt);
  return Number.isFinite(age) && age >= 0 && age <= SESSION_MAX_AGE_MS;
}

/** Test-only: removes the persisted store file between test cases. */
export function __resetAuthStoreForTests(): void {
  try {
    if (existsSync(STORE_PATH)) unlinkSync(STORE_PATH);
  } catch {
    // ignore
  }
}

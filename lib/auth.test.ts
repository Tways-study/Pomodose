import { afterEach, describe, expect, it, vi } from "vitest";
import {
  __resetAuthStoreForTests,
  createSessionToken,
  hasAccessCode,
  hashCode,
  hashesMatch,
  isValidSession,
  registerAccessCode,
  verifyAccessCode,
} from "./auth";

afterEach(() => __resetAuthStoreForTests());

describe("hashCode", () => {
  it("is deterministic", () => {
    expect(hashCode("secret-dose")).toBe(hashCode("secret-dose"));
  });

  it("differs for different input", () => {
    expect(hashCode("secret-dose")).not.toBe(hashCode("other-dose"));
  });
});

describe("hashesMatch", () => {
  it("matches identical hashes", () => {
    const h = hashCode("abc123");
    expect(hashesMatch(h, h)).toBe(true);
  });

  it("does not match different hashes", () => {
    expect(hashesMatch(hashCode("abc123"), hashCode("xyz789"))).toBe(false);
  });
});

describe("access code store", () => {
  it("has no code registered initially", () => {
    expect(hasAccessCode()).toBe(false);
  });

  it("registers a code and reports it as set", () => {
    registerAccessCode("open-sesame");
    expect(hasAccessCode()).toBe(true);
  });

  it("verifies the correct code", () => {
    registerAccessCode("open-sesame");
    expect(verifyAccessCode("open-sesame")).toBe(true);
  });

  it("rejects an incorrect code", () => {
    registerAccessCode("open-sesame");
    expect(verifyAccessCode("wrong-code")).toBe(false);
  });

  it("rejects verification when no code is registered yet", () => {
    expect(verifyAccessCode("anything")).toBe(false);
  });

  it("persists across independent reads (simulating separate Next.js bundles)", () => {
    // registerAccessCode/hasAccessCode/verifyAccessCode each independently
    // re-read the file rather than sharing an in-memory reference — this is
    // the whole point of the file-backed design (see lib/auth.ts's top
    // comment): Proxy, Route Handlers, and Server Components don't share
    // module state, but they all see the same file.
    registerAccessCode("dose-42");
    expect(hasAccessCode()).toBe(true);
    expect(verifyAccessCode("dose-42")).toBe(true);
  });
});

describe("session tokens", () => {
  it("cannot create a session before an access code is registered", () => {
    expect(createSessionToken()).toBeNull();
  });

  it("a freshly created token is valid once a code is registered", () => {
    registerAccessCode("dose-42");
    const token = createSessionToken();
    expect(token).not.toBeNull();
    expect(isValidSession(token)).toBe(true);
  });

  it("a malformed token is invalid", () => {
    registerAccessCode("dose-42");
    expect(isValidSession("not-a-real-token")).toBe(false);
    expect(isValidSession("123.wrongsignature")).toBe(false);
  });

  it("missing/null/undefined tokens are invalid", () => {
    registerAccessCode("dose-42");
    expect(isValidSession(undefined)).toBe(false);
    expect(isValidSession(null)).toBe(false);
    expect(isValidSession("")).toBe(false);
  });

  it("each created token is unique (different issuedAt/signature)", () => {
    registerAccessCode("dose-42");
    vi.spyOn(Date, "now").mockReturnValueOnce(1000).mockReturnValueOnce(2000);
    const a = createSessionToken();
    const b = createSessionToken();
    expect(a).not.toBe(b);
  });

  it("a token signed against one access code is invalid after re-registering a different one", () => {
    // Simulates a server restart + fresh registration: the old file is gone,
    // a new codeHash means a new derived session secret, so old tokens
    // (if somehow still held by a client) stop verifying.
    registerAccessCode("dose-42");
    const token = createSessionToken();
    __resetAuthStoreForTests();
    registerAccessCode("dose-99");
    expect(isValidSession(token)).toBe(false);
  });

  it("rejects an expired token", () => {
    registerAccessCode("dose-42");
    vi.spyOn(Date, "now").mockReturnValueOnce(0);
    const token = createSessionToken();
    vi.spyOn(Date, "now").mockReturnValue(31 * 24 * 60 * 60 * 1000); // 31 days later
    expect(isValidSession(token)).toBe(false);
  });
});

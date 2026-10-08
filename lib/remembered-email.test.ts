import { afterEach, describe, expect, it, vi } from "vitest";
import { clearRememberedEmail, readRememberedEmail, saveRememberedEmail } from "./remembered-email";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("remembered email", () => {
  it("reads null when nothing is stored", () => {
    expect(readRememberedEmail()).toBeNull();
  });

  it("round-trips a saved email, trimmed", () => {
    saveRememberedEmail("  ada@pharmacy.edu ");
    expect(readRememberedEmail()).toBe("ada@pharmacy.edu");
  });

  it("does not store a blank email", () => {
    saveRememberedEmail("   ");
    expect(readRememberedEmail()).toBeNull();
  });

  it("clears the stored email", () => {
    saveRememberedEmail("ada@pharmacy.edu");
    clearRememberedEmail();
    expect(readRememberedEmail()).toBeNull();
  });

  it("never throws when storage does, and says so", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readRememberedEmail()).toBeNull();
    expect(() => saveRememberedEmail("ada@pharmacy.edu")).not.toThrow();
    expect(() => clearRememberedEmail()).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(3);
  });
});

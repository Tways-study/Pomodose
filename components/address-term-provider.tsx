"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ADDRESS_TERMS, ADDRESS_STORAGE_KEY, type AddressTerm } from "@/lib/address-terms";

const AddressTermContext = createContext<AddressTerm>(ADDRESS_TERMS[0]);

/**
 * Provides the current address term to the whole app and advances it by one on
 * each full page load, so the name Pomodose calls you cycles across visits
 * (Pill Whisperer → Capsule → Elixir → …).
 *
 * The default is deterministic (index 0) so the server render and the first
 * client render agree — the cycled term is applied after mount, once
 * localStorage is available.
 */
export function AddressTermProvider({ children }: { children: ReactNode }) {
  const [term, setTerm] = useState<AddressTerm>(ADDRESS_TERMS[0]);

  useEffect(() => {
    let idx = 0;
    try {
      const stored = window.localStorage.getItem(ADDRESS_STORAGE_KEY);
      if (stored !== null) {
        const n = Number(stored);
        if (Number.isFinite(n)) {
          idx = ((n % ADDRESS_TERMS.length) + ADDRESS_TERMS.length) % ADDRESS_TERMS.length;
        }
      }
      // Advance for the next load so the address cycles across visits.
      window.localStorage.setItem(ADDRESS_STORAGE_KEY, String((idx + 1) % ADDRESS_TERMS.length));
    } catch {
      // localStorage unavailable (e.g. privacy mode) — keep the default term.
    }
    // Intentional: the cycled term is client-only (localStorage) and must be
    // applied post-hydration to keep the server/first-client render identical.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTerm(ADDRESS_TERMS[idx]);
  }, []);

  return <AddressTermContext.Provider value={term}>{children}</AddressTermContext.Provider>;
}

/** The current address term as a string — for use inside client components. */
export function useAddressTerm(): AddressTerm {
  return useContext(AddressTermContext);
}

/** The current address term as inline text — usable inside Server Components. */
export function AddressName() {
  return <>{useAddressTerm()}</>;
}

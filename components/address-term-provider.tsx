"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ADDRESS_TERMS, type AddressTerm } from "@/lib/address-terms";

const AddressTermContext = createContext<AddressTerm>(ADDRESS_TERMS[0]);

/**
 * Provides the current address term to the whole app, picking one at random on
 * each page load, so the name Pomodose calls you varies from visit to visit
 * (Pill Whisperer / Capsule / Elixir).
 *
 * The default is deterministic (index 0) so the server render and the first
 * client render agree — the random term is applied after mount.
 */
export function AddressTermProvider({ children }: { children: ReactNode }) {
  const [term, setTerm] = useState<AddressTerm>(ADDRESS_TERMS[0]);

  useEffect(() => {
    const idx = Math.floor(Math.random() * ADDRESS_TERMS.length);
    // Intentional: the term is chosen client-side and applied post-hydration to
    // keep the server and first-client render identical (no hydration mismatch).
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

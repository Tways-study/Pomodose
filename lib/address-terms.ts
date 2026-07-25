// The rotating set of names Pomodose uses to address the user. The active term
// cycles across visits (see components/address-term-provider.tsx).
export const ADDRESS_TERMS = ["Pill Whisperer", "Capsule", "Elixir"] as const;
export type AddressTerm = (typeof ADDRESS_TERMS)[number];

// localStorage key holding the index to use on the next load.
export const ADDRESS_STORAGE_KEY = "pomodose.addressTermIdx";

// Placeholder used in static copy (e.g. lib/quotes.ts) where the live term is
// substituted in at render time.
export const ADDRESS_TOKEN = "%NAME%";

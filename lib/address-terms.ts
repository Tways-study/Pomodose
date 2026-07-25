// The rotating set of names Pomodose uses to address the user. One is picked at
// random per page load (see components/address-term-provider.tsx).
export const ADDRESS_TERMS = ["Pill Whisperer", "Capsule", "Elixir"] as const;
export type AddressTerm = (typeof ADDRESS_TERMS)[number];

// Placeholder used in static copy (e.g. lib/quotes.ts) where the live term is
// substituted in at render time.
export const ADDRESS_TOKEN = "%NAME%";

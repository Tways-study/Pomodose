import config from "@/tailwind.config";

// The scene palette is read from the Tailwind theme so no hex lives in components.
const colors = config.theme?.extend?.colors as unknown as Record<string, string>;

function pick(token: string): string {
  const value = colors[token];
  if (typeof value !== "string") throw new Error(`Missing Tailwind color token: ${token}`);
  return value;
}

export const PALETTE = {
  sky: pick("gum-sky"),          // dose / focus
  mint: pick("gum-mint"),        // short break / done
  apricot: pick("gum-apricot"),  // long break
  butter: pick("gum-butter"),
  lilac: pick("gum-lilac"),      // Dosey / brand
  liquid: pick("dosey-lilac"),   // the vial's liquid
  line: pick("line-soft"),       // the cylinder's foot
  inkSoft: pick("ink-soft"),     // graduation marks and labels
  cream: pick("dosey-cream"),
  sprout: pick("dosey-sprout"),
  tomato: pick("dosey-tomato"),
} as const;

export type Tone = keyof typeof PALETTE;

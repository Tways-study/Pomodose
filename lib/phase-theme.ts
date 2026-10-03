import type { Phase } from "@/types";

// Gum sticker classes per phase: use these wherever a phase color is needed, never
// inline hex. Text is always `ink` on a gum color. The vial's liquid stays fixed lilac
// and is not driven by this.
export const PHASE_STICKER_CLASS: Record<Phase, string> = {
  focus: "bg-gum-sky text-ink",
  short: "bg-gum-mint text-ink",
  long:  "bg-gum-apricot text-ink",
};

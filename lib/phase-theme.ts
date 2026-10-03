import type { Phase } from "@/types";

// Gum sticker colors per phase. `on` is the text color that clears contrast on
// `base`. The vial's liquid stays fixed lilac and is not driven by this.
export const PHASE_ACCENT: Record<Phase, { base: string; deep: string; tint: string; on: string }> = {
  focus: { base: "#A8D4FF", deep: "#6FA8E8", tint: "#A8D4FF55", on: "#3A2F45" },
  short: { base: "#B4E5C4", deep: "#6CBF8A", tint: "#B4E5C455", on: "#3A2F45" },
  long:  { base: "#FFB88A", deep: "#E8895A", tint: "#FFB88A55", on: "#3A2F45" },
};

// Prefer these classes over inline hex wherever a sticker color is needed.
export const PHASE_STICKER_CLASS: Record<Phase, string> = {
  focus: "bg-gum-sky text-ink",
  short: "bg-gum-mint text-ink",
  long:  "bg-gum-apricot text-ink",
};

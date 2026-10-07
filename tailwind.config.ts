import type { Config } from "tailwindcss";

// "Gelcap Pastel" world: a pharmacy made of gumdrops and gelcaps. Soft peach
// ground, cream surfaces, plum-black ink, and pastel "gum" stickers that each
// mean one thing. Text on every gum color is `ink`.
// Contrast notes: ink is 9.8:1 on ground, 12.3:1 on surface. ink-soft is 5.6:1
// on surface and 5.1:1 on surface-2 but only 4.5:1 on ground, so use ink-soft
// on surfaces only. line-strong (3.6:1) is for interactive control borders;
// line-soft is decorative only. alert is 6.4:1 on surface.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  // hover: styles apply only on devices that can hover, so taps never leave them stuck.
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      colors: {
        ground: "#F8DFCF",
        surface: "#FFFCF8",
        "surface-2": "#FBEFE6",
        ink: "#3A2F45",
        "ink-soft": "#6E6178",
        "line-soft": "#E8D3C4",
        "line-strong": "#8A7A86",
        "gum-sky": "#A8D4FF", // dose / focus
        "gum-mint": "#B4E5C4", // refill / short break / done
        "gum-apricot": "#FFB88A", // antidote / long break / warnings
        "gum-butter": "#FFE28A", // nudges
        "gum-rose": "#FFB3C7", // remove / undo
        "gum-lilac": "#CDBBFF", // Dosey / chat
        alert: "#B42318",
        "dosey-lilac": "#B9A4F5",
        "dosey-cream": "#FFF1DC",
        "dosey-sprout": "#7CC38A",
        "dosey-tomato": "#FF7A6B",
        "dosey-blush": "#FF9FB2",
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-rounded", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "ui-rounded", "system-ui", "sans-serif"],
      },
      borderRadius: {
        bubble: "28px",
        control: "18px",
        pill: "9999px",
      },
      boxShadow: {
        soft: "0 1px 0 rgba(255,255,255,.9) inset, 0 10px 24px -12px rgba(150,90,60,.30)",
        pop: "0 1px 0 rgba(255,255,255,.55) inset, 0 6px 14px -6px rgba(58,47,69,.45)",
        gum: "0 1px 0 rgba(255,255,255,.7) inset, 0 3px 8px -3px rgba(150,90,60,.35)",
      },
      zIndex: {
        base: "0",
        content: "10",
        sticky: "20",
        overlay: "30",
        modal: "50",
      },
    },
  },
  plugins: [],
};
export default config;

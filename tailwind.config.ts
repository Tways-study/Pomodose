import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper:      "#F6F2EC",
        "paper-2":  "#EFE9DF",
        ink:        "#2E2433",
        "ink-soft": "#6B5E6F",
        lilac:      "#C9B6E4",
        "lilac-deep":"#8465B0",
        amber:      "#D9B36B",
        "amber-deep":"#B98A3E",
        sage:       "#A8B89A",
        clay:       "#E0B4A8",
        "clay-deep":"#A96552",
        line:       "#DED5C8",
        // Borders on the paper-2 surface (inputs). `line` measures 1.20:1 there,
        // short of WCAG 1.4.11's 3:1 for a UI component boundary; this clears it
        // at 3.14:1 without darkening every card edge in the app.
        "line-strong":"#948066",
      },
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        sans:  ["Spline Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "18px",
        control: "12px",
      },
      // Layered, ink-tinted shadows (never black) with a 1px top highlight.
      // `running` is the neutral fallback; phase-tinted glow comes from
      // runningShadow() in lib/phase-theme.ts.
      boxShadow: {
        card:  "0 1px 0 rgba(255,255,255,.7) inset, 0 1px 2px rgba(46,36,51,.04), 0 10px 28px -16px rgba(46,36,51,.14)",
        panel: "0 1px 0 rgba(255,255,255,.7) inset, 0 2px 6px rgba(46,36,51,.06), 0 28px 60px -22px rgba(46,36,51,.34)",
        fab:   "0 1px 0 rgba(255,255,255,.35) inset, 0 2px 6px rgba(46,36,51,.10), 0 12px 28px -10px rgba(46,36,51,.40)",
        press: "0 1px 0 rgba(255,255,255,.35) inset, 0 1px 2px rgba(46,36,51,.14), 0 6px 14px -8px rgba(46,36,51,.30)",
      },
    },
  },
  plugins: [],
};
export default config;

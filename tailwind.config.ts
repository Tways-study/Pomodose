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
      },
    },
  },
  plugins: [],
};
export default config;

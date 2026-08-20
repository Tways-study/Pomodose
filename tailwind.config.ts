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
        "lilac-deep":"#9B7FC4",
        amber:      "#D9B36B",
        "amber-deep":"#B98A3E",
        sage:       "#A8B89A",
        clay:       "#E0B4A8",
        line:       "#DED5C8",
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

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pomodose — Study Companion",
    short_name: "Pomodose",
    description: "A measured-dose focus timer and study companion for pharmacy students and pharmacists.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8DFCF",
    theme_color: "#F8DFCF",
    icons: [{ src: "/icon.png", sizes: "192x192 512x512", type: "image/png", purpose: "any" }],
  };
}

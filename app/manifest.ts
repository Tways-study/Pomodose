import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pomodose — Study Companion",
    short_name: "Pomodose",
    description: "A measured-dose focus timer for the pharmacist in your life.",
    start_url: "/",
    display: "standalone",
    background_color: "#F6F2EC",
    theme_color: "#F6F2EC",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
  };
}

import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { AddressTermProvider } from "@/components/address-term-provider";
import "./globals.css";

// Fredoka: rounded display face (variable weight) for headings, labels, digits.
const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

// Nunito: friendly rounded body face (variable weight).
const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const TITLE = "Pomodose — Study Companion";
const DESCRIPTION = "A measured-dose focus timer and study companion for pharmacy students and pharmacists.";

export const metadata: Metadata = {
  // Absolute base for the Open Graph / Twitter image URLs. Vercel provides the
  // production host; locally it falls back to the dev server.
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000",
  ),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  appleWebApp: { capable: true, title: "Pomodose", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F8DFCF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en" className={`${fredoka.variable} ${nunito.variable}`}>
        <body className="font-body bg-ground text-ink antialiased">
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-modal focus:rounded-pill focus:bg-ink focus:px-5 focus:py-3 focus:font-display focus:text-surface focus:shadow-pop"
          >
            Skip to content
          </a>
          <ConvexClientProvider>
            <AddressTermProvider>{children}</AddressTermProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}

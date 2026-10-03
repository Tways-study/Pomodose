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
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
  appleWebApp: { capable: true, title: "Pomodose", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F8DFCF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en" className={`${fredoka.variable} ${nunito.variable}`}>
        <body className="font-body bg-ground text-ink antialiased">
          <ConvexClientProvider>
            <AddressTermProvider>{children}</AddressTermProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}

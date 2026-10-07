"use client";

import { useEffect } from "react";
import "./globals.css";

// Last-resort boundary: it replaces the root layout, so there are no providers and
// the next/font variables are not defined. The `font-display`/`font-body` utilities
// would resolve to nothing here, so the rounded system stack is set inline instead.
const FALLBACK_FONT = 'ui-rounded, "SF Pro Rounded", system-ui, sans-serif';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Pomodose: unhandled root error", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-ground text-ink antialiased" style={{ fontFamily: FALLBACK_FONT }}>
        <main className="flex min-h-dvh items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm rounded-bubble border border-line-soft bg-surface text-ink shadow-soft">
            <div className="p-5 sm:p-6">
              <span className="inline-block -rotate-3 rounded-pill bg-gum-apricot px-3 py-1 text-sm font-medium text-ink shadow-gum">
                Oops
              </span>
              <h1 className="mt-4 text-2xl font-semibold">Something went sideways</h1>
              <p className="mt-2 text-sm text-ink-soft">
                Pomodose hit a snag it couldn&apos;t recover from. Try again, or reload the page.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={reset}
                  className="flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-pill bg-ink px-6 py-3 text-base font-medium text-surface shadow-pop transition-transform active:scale-95"
                >
                  Try again
                </button>
                {/* A plain anchor on purpose: after a root-layout crash a full page load is the
                    reliable way home, where client-side <Link> navigation may not recover. */}
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a
                  href="/"
                  className="flex min-h-[44px] items-center justify-center text-sm text-ink underline decoration-gum-lilac decoration-2 underline-offset-4"
                >
                  Back to Pomodose
                </a>
              </div>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}

"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Pomodose: unhandled render error", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="flex flex-col items-center gap-2 mb-6">
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden>
            <rect x="11" y="2" width="12" height="6" rx="2" fill="#C9B6E4" stroke="#2E2433" strokeWidth="2" />
            <path
              d="M13 8v5l-5 14a4 4 0 0 0 3.7 5.5h10.6A4 4 0 0 0 26 27L21 13V8"
              stroke="#2E2433"
              strokeWidth="2"
              fill="rgba(201,182,228,.35)"
            />
            <path d="M9.2 24h15.6" stroke="#9B7FC4" strokeWidth="2" />
          </svg>
          <h1 className="font-serif font-medium text-2xl tracking-tight">Pomodose</h1>
        </div>

        <div className="bg-paper border border-line rounded-card p-6 sm:p-8 shadow-[0_1px_0_white_inset,0_8px_26px_-18px_rgba(46,36,51,.10)]">
          <h2 className="font-serif font-semibold text-xl">Something went sideways, Doc</h2>
          <p className="mt-1.5 text-sm text-ink-soft">
            That last dose didn&apos;t go down smoothly. Try again, or head back and pick up where you left off.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={reset}
              className="w-full rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper hover:opacity-90 transition-opacity duration-200"
            >
              Try again
            </button>
            <Link
              href="/"
              className="text-center text-xs text-ink-soft hover:text-ink transition-colors"
            >
              Back to Pomodose
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

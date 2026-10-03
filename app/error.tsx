"use client";

import { RotateCcw } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect } from "react";
import { SPRING_BOUNCY } from "@/lib/motion";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    console.error("Pomodose: unhandled render error", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ground px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="rounded-bubble border border-line-soft bg-surface text-ink shadow-soft">
          <div className="p-5 sm:p-6">
            <span className="inline-block -rotate-3 rounded-pill bg-gum-apricot px-3 py-1 font-display text-sm font-medium text-ink shadow-gum">
              Oops
            </span>
            <h1 className="mt-4 font-display text-2xl font-semibold">Something went sideways</h1>
            <p className="mt-2 font-body text-sm text-ink-soft">
              That last dose didn&apos;t go down smoothly. Try again, or head back and pick up where you left off.
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <motion.button
                onClick={reset}
                whileTap={reduceMotion ? undefined : { scale: 0.94 }}
                transition={SPRING_BOUNCY}
                className="flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-pill bg-ink px-6 py-3 font-display text-base font-medium text-surface shadow-pop"
              >
                <RotateCcw size={18} strokeWidth={2.25} aria-hidden />
                Try again
              </motion.button>
              <Link
                href="/"
                className="flex min-h-[44px] items-center justify-center font-body text-sm text-ink underline decoration-gum-lilac decoration-2 underline-offset-4"
              >
                Back to Pomodose
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

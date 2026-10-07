import { Home } from "lucide-react";
import Link from "next/link";
import { DoseyRig } from "@/components/dosey/dosey-rig";

export default function NotFound() {
  return (
    <main id="main" tabIndex={-1} className="flex min-h-dvh items-center justify-center bg-ground px-4 py-12 outline-none">
      <div className="w-full max-w-sm rounded-bubble border border-line-soft bg-surface text-ink shadow-soft">
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <DoseyRig size={72} mood="sleepy" />
            <span className="inline-block -rotate-3 rounded-pill bg-gum-butter px-3 py-1 font-display text-sm font-medium text-ink shadow-gum">
              Not found
            </span>
          </div>
          <h1 className="mt-4 font-display text-2xl font-semibold">That page wandered off</h1>
          <p className="mt-2 font-body text-sm text-ink-soft">
            We couldn&apos;t find what you were looking for. Head back and pick up where you left off.
          </p>

          <Link
            href="/"
            className="mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-pill bg-ink px-6 py-3 font-display text-base font-medium text-surface shadow-pop transition-transform active:scale-95 [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-0.5"
          >
            <Home size={18} strokeWidth={2.25} aria-hidden />
            Back to Pomodose
          </Link>
        </div>
      </div>
    </main>
  );
}

import { hasAccessCode } from "@/lib/auth";
import { GateForm } from "@/components/gate-form";

// This reads in-memory server state (not cookies()/headers()), so Next has
// no automatic signal to treat it as dynamic — force it, or the register/
// login mode gets baked into a static snapshot at build time and never
// updates again.
export const dynamic = "force-dynamic";

export default function GatePage() {
  const mode = hasAccessCode() ? "login" : "register";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
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
          <GateForm mode={mode} />
        </div>

        <p className="mt-4 text-center text-xs text-ink-soft">
          {mode === "register"
            ? "No recovery yet — if you forget your code, the server needs a restart to reset it."
            : "Forgot your code? The server needs a restart to reset it."}
        </p>
      </div>
    </div>
  );
}

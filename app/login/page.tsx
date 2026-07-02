import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
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
          <LoginForm />
        </div>

        <p className="mt-4 text-center text-xs text-ink-soft">
          Forgot your password? Password reset isn&apos;t set up yet, Doc — for now, a new
          account is the way back in.
        </p>
      </div>
    </div>
  );
}

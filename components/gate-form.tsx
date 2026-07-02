"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

interface Props {
  mode: "register" | "login";
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M1.5 9S4 3.5 9 3.5 16.5 9 16.5 9 14 14.5 9 14.5 1.5 9 1.5 9Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="9" r="2.25" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M2.5 2.5l13 13M7.4 7.55A2.25 2.25 0 0 0 9 11.25c.55 0 1.05-.2 1.44-.53M5.2 5.1C3.2 6.3 1.5 9 1.5 9s2.5 5.5 7.5 5.5c1.4 0 2.6-.4 3.6-.98M12.9 12.9C14.6 11.75 16.5 9 16.5 9s-1.05-2.35-3.15-3.9"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GateForm({ mode }: Props) {
  const router = useRouter();
  const codeId = useId();
  const confirmId = useId();

  const [code, setCode] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);

    if (mode === "register" && code.length < 4) {
      setError("Access codes need at least 4 characters.");
      return;
    }
    if (mode === "register" && code !== confirmCode) {
      setError("Those two codes don't match. Give it another try, Doc.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "register" ? { action: "register", code, confirmCode } : { action: "login", code },
        ),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Something went wrong. Try again.");
        setIsSubmitting(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Couldn't reach Pomodose. Check your connection and try again.");
      setIsSubmitting(false);
    }
  }

  const inputType = reveal ? "text" : "password";

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mb-5 text-center">
        <h2 className="font-serif font-semibold text-xl">
          {mode === "register" ? "Set your access code, Doc" : "Welcome back, Doc"}
        </h2>
        <p className="mt-1.5 text-sm text-ink-soft">
          {mode === "register"
            ? "Choose a code to keep Pomodose just for you."
            : "Enter your access code to continue."}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label
            htmlFor={codeId}
            className="block mb-1.5 text-xs font-medium tracking-[.14em] uppercase text-ink-soft"
          >
            Access code
          </label>
          <div className="relative">
            <input
              id={codeId}
              type={inputType}
              value={code}
              maxLength={64}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              autoFocus
              disabled={isSubmitting}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded-xl border border-line bg-paper-2 px-3.5 py-2.5 pr-11 text-sm placeholder:text-ink-soft focus:border-lilac-deep focus:ring-2 focus:ring-lilac/30 outline-none transition-all disabled:opacity-60"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setReveal((v) => !v)}
              aria-label={reveal ? "Hide access code" : "Show access code"}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-soft hover:text-ink transition-colors"
            >
              <EyeIcon open={reveal} />
            </button>
          </div>
        </div>

        {mode === "register" && (
          <div>
            <label
              htmlFor={confirmId}
              className="block mb-1.5 text-xs font-medium tracking-[.14em] uppercase text-ink-soft"
            >
              Confirm access code
            </label>
            <input
              id={confirmId}
              type={inputType}
              value={confirmCode}
              maxLength={64}
              autoComplete="new-password"
              disabled={isSubmitting}
              onChange={(e) => setConfirmCode(e.target.value)}
              className="w-full rounded-xl border border-line bg-paper-2 px-3.5 py-2.5 text-sm placeholder:text-ink-soft focus:border-lilac-deep focus:ring-2 focus:ring-lilac/30 outline-none transition-all disabled:opacity-60"
              placeholder="••••••••"
            />
          </div>
        )}

        {error && (
          <p className="rounded-xl bg-clay/25 px-3 py-2 text-sm text-ink" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !code || (mode === "register" && !confirmCode)}
          className="mt-1 w-full rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper hover:opacity-90 transition-opacity duration-200 disabled:opacity-40"
        >
          {mode === "register"
            ? isSubmitting
              ? "Setting…"
              : "Set access code"
            : isSubmitting
              ? "Unlocking…"
              : "Unlock Pomodose"}
        </button>
      </div>
    </form>
  );
}

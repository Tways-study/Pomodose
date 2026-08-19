"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useAddressTerm } from "@/components/address-term-provider";

type Mode = "login" | "register";

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

function friendlyError(err: unknown, name: string): string {
  const message = err instanceof Error ? err.message : "";
  if (message.includes("already exists")) {
    return `Looks like you already have an account with that email, ${name}. Try signing in instead.`;
  }
  if (message.includes("InvalidAccountId") || message.includes("InvalidSecret")) {
    return `That email or password doesn't match, ${name}. Try again.`;
  }
  if (message.includes("TooManyFailedAttempts")) {
    return `Too many tries, ${name} — give it a minute and try again.`;
  }
  if (message.includes("Invalid password")) {
    return `Passwords need at least 8 characters, ${name}.`;
  }
  if (message.includes("Invalid email address")) {
    return `That doesn't look like a valid email, ${name}.`;
  }
  return "Something went wrong. Try again.";
}

const labelClass = "block mb-1.5 text-xs font-medium tracking-[.14em] uppercase text-ink-soft";
const inputClass =
  "w-full rounded-xl border border-line bg-paper-2 px-3.5 py-2.5 text-sm placeholder:text-ink-soft focus:border-lilac-deep focus:ring-2 focus:ring-lilac/30 outline-none transition-[border-color,box-shadow] disabled:opacity-60";
const submitClass =
  "mt-1 w-full rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper hover:opacity-90 transition-opacity duration-200 disabled:opacity-40";
const backLinkClass = "text-center text-xs text-ink-soft hover:text-ink transition-colors disabled:opacity-60";

export function LoginForm() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const addressName = useAddressTerm();
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmId = useId();

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleMode() {
    setMode((m) => (m === "login" ? "register" : "login"));
    setError(null);
    setPassword("");
    setConfirmPassword("");
  }

  async function handleLoginOrRegister(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);

    if (mode === "register" && password !== confirmPassword) {
      setError(`Those two passwords don't match. Give it another try, ${addressName}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Password-only: signUp creates the account and signs in immediately —
      // there is no email verification step.
      await signIn("password", {
        flow: mode === "login" ? "signIn" : "signUp",
        email,
        password,
        ...(mode === "register" && name ? { name } : {}),
      });
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(friendlyError(err, addressName));
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputType = reveal ? "text" : "password";

  return (
    <form onSubmit={handleLoginOrRegister} noValidate>
      <div className="mb-5 text-center">
        <h2 className="font-serif font-medium text-2xl tracking-[-0.01em]">
          {mode === "register" ? `Set up your dose log, ${addressName}` : `Welcome back, ${addressName}`}
        </h2>
        <p className="mt-1.5 text-sm text-ink-soft">
          {mode === "register"
            ? "Create an account to keep your regimen close."
            : "Sign in to pick up where you left off."}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <AnimatePresence initial={false}>
          {mode === "register" && (
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <label htmlFor={nameId} className={labelClass}>
                Name (optional)
              </label>
              <input
                id={nameId}
                type="text"
                value={name}
                maxLength={80}
                autoComplete="name"
                disabled={isSubmitting}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder={addressName}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <label htmlFor={emailId} className={labelClass}>
            Email
          </label>
          <input
            id={emailId}
            type="email"
            value={email}
            maxLength={254}
            autoComplete="email"
            autoFocus
            required
            disabled={isSubmitting}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="doc@apothecary.com"
          />
        </div>

        <div>
          <label htmlFor={passwordId} className={labelClass}>
            Password
          </label>
          <div className="relative">
            <input
              id={passwordId}
              type={inputType}
              value={password}
              maxLength={128}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              required
              disabled={isSubmitting}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} pr-11`}
              placeholder="••••••••"
            />
            <motion.button
              type="button"
              onClick={() => setReveal((v) => !v)}
              aria-label={reveal ? "Hide password" : "Show password"}
              whileTap={reduceMotion ? undefined : { scale: 0.95 }}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-soft hover:text-ink transition-colors"
            >
              <EyeIcon open={reveal} />
            </motion.button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {mode === "register" && (
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <label htmlFor={confirmId} className={labelClass}>
                Confirm password
              </label>
              <input
                id={confirmId}
                type={inputType}
                value={confirmPassword}
                maxLength={128}
                autoComplete="new-password"
                required
                disabled={isSubmitting}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <p className="rounded-xl bg-clay/25 px-3 py-2 text-sm text-ink" role="alert">
            {error}
          </p>
        )}

        <motion.button
          type="submit"
          disabled={isSubmitting || !email || !password || (mode === "register" && !confirmPassword)}
          whileTap={reduceMotion ? undefined : { scale: 0.95 }}
          className={submitClass}
        >
          {mode === "register"
            ? isSubmitting
              ? "Setting up…"
              : "Create account"
            : isSubmitting
              ? "Signing in…"
              : "Sign in"}
        </motion.button>

        <motion.button
          type="button"
          onClick={toggleMode}
          disabled={isSubmitting}
          whileTap={reduceMotion ? undefined : { scale: 0.95 }}
          className={backLinkClass}
        >
          {mode === "register"
            ? "Already have an account? Sign in."
            : `New here? Create an account, ${addressName}.`}
        </motion.button>
      </div>
    </form>
  );
}

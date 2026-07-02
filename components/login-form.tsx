"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "register" | "verify-code" | "forgot-password" | "reset-code";

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

function friendlyError(err: unknown): string {
  const message = err instanceof Error ? err.message : "";
  if (message.includes("already exists")) {
    return "Looks like you already have an account with that email, Doc. Try signing in instead.";
  }
  if (message.includes("InvalidAccountId") || message.includes("InvalidSecret")) {
    return "That email or password doesn't match, Doc. Try again.";
  }
  if (message.includes("TooManyFailedAttempts")) {
    return "Too many tries, Doc — give it a minute and try again.";
  }
  if (message.includes("Invalid password")) {
    return "Passwords need at least 8 characters, Doc.";
  }
  if (message.includes("Could not verify code")) {
    return "That code didn't match or has expired, Doc. Try again.";
  }
  return "Something went wrong. Try again.";
}

const labelClass = "block mb-1.5 text-xs font-medium tracking-[.14em] uppercase text-ink-soft";
const inputClass =
  "w-full rounded-xl border border-line bg-paper-2 px-3.5 py-2.5 text-sm placeholder:text-ink-soft focus:border-lilac-deep focus:ring-2 focus:ring-lilac/30 outline-none transition-all disabled:opacity-60";
const submitClass =
  "mt-1 w-full rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper hover:opacity-90 transition-opacity duration-200 disabled:opacity-40";
const backLinkClass = "text-center text-xs text-ink-soft hover:text-ink transition-colors disabled:opacity-60";

export function LoginForm() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmId = useId();
  // Reused across the verify-code and reset-code screens below — safe
  // because those two render branches are mutually exclusive early
  // returns and never mount at the same time.
  const codeId = useId();
  const newPasswordId = useId();
  const confirmNewPasswordId = useId();

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleMode() {
    setMode((m) => (m === "login" ? "register" : "login"));
    setError(null);
    setInfo(null);
    setPassword("");
    setConfirmPassword("");
  }

  function goToLogin() {
    setMode("login");
    setError(null);
    setInfo(null);
    setPassword("");
    setConfirmPassword("");
    setCode("");
    setNewPassword("");
    setConfirmNewPassword("");
  }

  async function handleLoginOrRegister(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setInfo(null);

    if (mode === "register" && password !== confirmPassword) {
      setError("Those two passwords don't match. Give it another try, Doc.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signIn("password", {
        flow: mode === "login" ? "signIn" : "signUp",
        email,
        password,
        ...(mode === "register" && name ? { name } : {}),
      });
      if (result.signingIn) {
        router.push("/");
        router.refresh();
        return;
      }
      // Verification is mandatory: a successful signUp, or a signIn on an
      // unverified account, sends a code instead of completing sign-in.
      setInfo(
        mode === "register"
          ? `We've emailed a 6-digit code to ${email}. Enter it below to finish setting up your account, Doc.`
          : `This account hasn't been verified yet — we've emailed a fresh code to ${email}.`,
      );
      setMode("verify-code");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn("password", { flow: "email-verification", email, code });
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRequestReset(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setInfo(null);
    setIsSubmitting(true);
    try {
      await signIn("password", { flow: "reset", email });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      // Don't let "no account with that email" behave differently from a
      // real send — that would let this form be used to check which
      // emails are registered. Every other error is still surfaced.
      if (!message.includes("InvalidAccountId")) {
        setError(friendlyError(err));
        setIsSubmitting(false);
        return;
      }
    }
    setInfo(`If an account exists for ${email}, we've sent a code, Doc.`);
    setMode("reset-code");
    setIsSubmitting(false);
  }

  async function handleResetVerification(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);

    if (newPassword !== confirmNewPassword) {
      setError("Those two passwords don't match. Give it another try, Doc.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn("password", { flow: "reset-verification", email, code, newPassword });
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputType = reveal ? "text" : "password";

  if (mode === "verify-code") {
    return (
      <form onSubmit={handleVerifyCode} noValidate>
        <div className="mb-5 text-center">
          <h2 className="font-serif font-semibold text-xl">Check your email, Doc</h2>
          {info && (
            <p className="mt-1.5 text-sm text-ink-soft" aria-live="polite">
              {info}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor={codeId} className={labelClass}>
              6-digit code
            </label>
            <input
              id={codeId}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              autoComplete="one-time-code"
              autoFocus
              required
              disabled={isSubmitting}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className={inputClass}
              placeholder="123456"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-clay/25 px-3 py-2 text-sm text-ink" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={isSubmitting || code.length !== 6} className={submitClass}>
            {isSubmitting ? "Confirming…" : "Confirm code"}
          </button>

          <button type="button" onClick={goToLogin} disabled={isSubmitting} className={backLinkClass}>
            Back to sign in
          </button>
        </div>
      </form>
    );
  }

  if (mode === "forgot-password") {
    return (
      <form onSubmit={handleRequestReset} noValidate>
        <div className="mb-5 text-center">
          <h2 className="font-serif font-semibold text-xl">Let&apos;s get you back in, Doc</h2>
          <p className="mt-1.5 text-sm text-ink-soft">
            Enter your email and we&apos;ll send you a code to reset your password.
          </p>
        </div>
        <div className="flex flex-col gap-4">
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

          {error && (
            <p className="rounded-xl bg-clay/25 px-3 py-2 text-sm text-ink" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={isSubmitting || !email} className={submitClass}>
            {isSubmitting ? "Sending…" : "Send reset code"}
          </button>

          <button type="button" onClick={goToLogin} disabled={isSubmitting} className={backLinkClass}>
            Back to sign in
          </button>
        </div>
      </form>
    );
  }

  if (mode === "reset-code") {
    return (
      <form onSubmit={handleResetVerification} noValidate>
        <div className="mb-5 text-center">
          <h2 className="font-serif font-semibold text-xl">Set a new password, Doc</h2>
          {info && (
            <p className="mt-1.5 text-sm text-ink-soft" aria-live="polite">
              {info}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor={codeId} className={labelClass}>
              6-digit code
            </label>
            <input
              id={codeId}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              autoComplete="one-time-code"
              autoFocus
              required
              disabled={isSubmitting}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className={inputClass}
              placeholder="123456"
            />
          </div>

          <div>
            <label htmlFor={newPasswordId} className={labelClass}>
              New password
            </label>
            <input
              id={newPasswordId}
              type={inputType}
              value={newPassword}
              maxLength={128}
              autoComplete="new-password"
              required
              disabled={isSubmitting}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor={confirmNewPasswordId} className={labelClass}>
              Confirm new password
            </label>
            <input
              id={confirmNewPasswordId}
              type={inputType}
              value={confirmNewPassword}
              maxLength={128}
              autoComplete="new-password"
              required
              disabled={isSubmitting}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-clay/25 px-3 py-2 text-sm text-ink" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || code.length !== 6 || !newPassword || !confirmNewPassword}
            className={submitClass}
          >
            {isSubmitting ? "Resetting…" : "Reset password"}
          </button>

          <button type="button" onClick={goToLogin} disabled={isSubmitting} className={backLinkClass}>
            Back to sign in
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleLoginOrRegister} noValidate>
      <div className="mb-5 text-center">
        <h2 className="font-serif font-semibold text-xl">
          {mode === "register" ? "Set up your dose log, Doc" : "Welcome back, Doc"}
        </h2>
        <p className="mt-1.5 text-sm text-ink-soft">
          {mode === "register"
            ? "Create an account to keep your regimen close."
            : "Sign in to pick up where you left off."}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {mode === "register" && (
          <div>
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
              placeholder="Doc"
            />
          </div>
        )}

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
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor={passwordId} className="text-xs font-medium tracking-[.14em] uppercase text-ink-soft">
              Password
            </label>
            {mode === "login" && (
              <button
                type="button"
                onClick={() => {
                  setMode("forgot-password");
                  setError(null);
                  setInfo(null);
                }}
                className="text-xs text-ink-soft hover:text-ink transition-colors"
              >
                Forgot password?
              </button>
            )}
          </div>
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
            <button
              type="button"
              onClick={() => setReveal((v) => !v)}
              aria-label={reveal ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-soft hover:text-ink transition-colors"
            >
              <EyeIcon open={reveal} />
            </button>
          </div>
        </div>

        {mode === "register" && (
          <div>
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
          </div>
        )}

        {error && (
          <p className="rounded-xl bg-clay/25 px-3 py-2 text-sm text-ink" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !email || !password || (mode === "register" && !confirmPassword)}
          className={submitClass}
        >
          {mode === "register"
            ? isSubmitting
              ? "Setting up…"
              : "Create account"
            : isSubmitting
              ? "Signing in…"
              : "Sign in"}
        </button>

        <button type="button" onClick={toggleMode} disabled={isSubmitting} className={backLinkClass}>
          {mode === "register"
            ? "Already have an account? Sign in."
            : "New here? Create an account, Doc."}
        </button>
      </div>
    </form>
  );
}

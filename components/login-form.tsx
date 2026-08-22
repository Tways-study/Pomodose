"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { ConvexError } from "convex/values";
import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useAddressTerm } from "@/components/address-term-provider";
import { PasswordStrengthMeter } from "@/components/password-strength-meter";

type Mode = "login" | "register" | "reset-request" | "reset-verify";

/** Which fields a failed submit flagged, keyed by the same names as the state. */
type FieldErrors = Partial<Record<"email" | "password" | "confirmPassword" | "code", string>>;

/** Mirrors the 8-character floor the Convex Password provider enforces server-side. */
const MIN_PASSWORD_LENGTH = 8;

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

/** Leading mark on the error banner, so the message reads as an alert and not a field. */
function AlertMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="mt-0.5 flex-none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 4.75v3.75" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="11" r=".85" fill="currentColor" />
    </svg>
  );
}

// Framework error strings, matched verbatim against @convex-dev/auth's Password
// provider (node_modules/@convex-dev/auth/dist/providers/Password.js) and the
// scaffolded reset email provider (convex/BrevoOTPPasswordReset.ts) — these are
// the actual identifiers those throw, not guesses.
//
// convex/BrevoOTPPasswordReset.ts throws `ConvexError`, not a plain `Error` —
// verified empirically against the lovely-blackbird-165 dev deployment via the
// real client SDK (ConvexHttpClient, the same code the browser sync client is
// built on): `err.message` arrives polluted with Convex's own
// "[Request ID: ...] Server Error" boilerplate (and per Convex's docs, on a
// *prod* deployment that's ALL `.message` contains — no substring survives to
// match against). `err.data`, by contrast, arrives as the exact string passed
// to `ConvexError(...)`, untouched, in both dev and prod — that's the whole
// point of `ConvexError`. So a `ConvexError`'s `.data` must be read first;
// `.message` substring-matching is kept only as the fallback path for the
// framework's own plain `Error` throws (Password.js), which aren't ours to
// convert and still arrive as an unwrapped message.
function friendlyError(err: unknown, name: string, mode: Mode): string {
  const message =
    err instanceof ConvexError && typeof err.data === "string"
      ? err.data
      : err instanceof Error
        ? err.message
        : "";
  if (message.includes("already exists")) {
    return `Looks like you already have an account with that email, ${name}. Try signing in instead.`;
  }
  if (message.includes("InvalidAccountId") || message.includes("InvalidSecret")) {
    // Same framework error covers "no such account" in both signIn and reset-request —
    // a single-user gift app has no account-enumeration concern worth a vaguer message.
    if (mode === "reset-request") {
      return `There's no account with that email yet, ${name}.`;
    }
    return `That email or password doesn't match, ${name}. Try again.`;
  }
  if (message.includes("TooManyFailedAttempts")) {
    return `Too many tries, ${name} — give it a minute and try again.`;
  }
  if (message.includes("not configured yet")) {
    return `Password reset isn't set up yet, ${name} — ask whoever set this up for you.`;
  }
  if (message.includes("Invalid code") || message.includes("Could not verify code")) {
    return `That code's wrong or expired, ${name}. Ask for a new one below.`;
  }
  if (message.includes("Invalid password")) {
    return `Passwords need at least ${MIN_PASSWORD_LENGTH} characters, ${name}.`;
  }
  if (message.includes("Invalid email address")) {
    return `That doesn't look like a valid email, ${name}.`;
  }
  return "Something went wrong. Try again.";
}

// Deliberately permissive — this only has to catch the typos a person makes
// (missing @, missing domain, stray spaces). convex/auth.ts re-validates with zod,
// which stays the authority on what counts as a valid address.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Checks the form the way the user filled it in, so a failed submit can name the
 * field instead of leaving a greyed-out button and no explanation. Returns the
 * fields to flag, in the order they appear in the form.
 */
function validate(
  mode: Mode,
  values: { email: string; password: string; confirmPassword: string; code: string },
  name: string,
): FieldErrors {
  const errors: FieldErrors = {};

  // The email field isn't rendered (or editable) during reset-verify — it was
  // already committed by the reset-request step.
  if (mode !== "reset-verify") {
    if (!values.email.trim()) {
      errors.email = `Your email goes here, ${name}.`;
    } else if (!EMAIL_SHAPE.test(values.email.trim())) {
      errors.email = "That doesn't look like an email address yet.";
    }
  }

  if (mode === "reset-request") return errors;

  if (mode === "reset-verify" && !values.code.trim()) {
    errors.code = "Enter the code from the email.";
  }

  if (!values.password) {
    errors.password = mode === "reset-verify" ? "Your new password goes here." : "Your password goes here.";
  } else if ((mode === "register" || mode === "reset-verify") && values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `A little longer — ${MIN_PASSWORD_LENGTH} characters at minimum.`;
  }

  if (mode === "register" || mode === "reset-verify") {
    if (!values.confirmPassword) {
      errors.confirmPassword = "Type that password once more.";
    } else if (values.password !== values.confirmPassword) {
      errors.confirmPassword = "These two don't match yet.";
    }
  }

  return errors;
}

const labelTextClass = "text-xs font-medium tracking-[.14em] uppercase text-ink-soft";
const labelClass = `block mb-1.5 ${labelTextClass}`;
// border-line-strong, not border-line: on the paper-2 input fill, `line` measures
// 1.20:1 — under WCAG 1.4.11's 3:1 for a component boundary — which left the fields
// reading as unbordered blocks. See the token comment in tailwind.config.ts.
const inputClass =
  "w-full rounded-xl border bg-paper-2 px-3.5 py-2.5 text-sm placeholder:text-ink-soft focus:ring-2 focus:ring-lilac/30 outline-none transition-[border-color,box-shadow] disabled:opacity-60";
const inputRestClass = "border-line-strong focus:border-lilac-deep";
const inputInvalidClass = "border-clay-deep focus:border-clay-deep";
// No disabled-until-valid state: the button stays live so a failed submit can say
// what is actually missing. The only disabled case left is the in-flight one, which
// keeps the full ink fill (13.3:1) and reports itself through the label.
const submitClass =
  "mt-1 w-full rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper hover:opacity-90 transition-opacity duration-200 disabled:cursor-wait";
const backLinkClass = "text-center text-xs text-ink-soft hover:text-ink transition-colors disabled:opacity-60";
const fieldErrorClass = "mt-1.5 text-xs text-clay-deep";

const MODE_COPY: Record<Mode, { submitLabel: string; submittingLabel: string }> = {
  login: { submitLabel: "Sign in", submittingLabel: "Signing in…" },
  register: { submitLabel: "Create account", submittingLabel: "Setting up…" },
  "reset-request": { submitLabel: "Send reset code", submittingLabel: "Sending…" },
  "reset-verify": { submitLabel: "Reset password", submittingLabel: "Resetting…" },
};

export function LoginForm() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const addressName = useAddressTerm();
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmId = useId();
  const codeId = useId();

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  /** Clears one field's error as soon as the user starts fixing it. */
  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  /** Switches the visible step. Email carries forward; everything else about the previous step doesn't. */
  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setFieldErrors({});
    setPassword("");
    setConfirmPassword("");
    setResetCode("");
    setResendState("idle");
  }

  async function resendCode() {
    if (resendState === "sending") return;
    setError(null);
    setResendState("sending");
    try {
      await signIn("password", { flow: "reset", email });
      setResendState("sent");
    } catch (err) {
      setResendState("idle");
      setError(friendlyError(err, addressName, mode));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);

    const found = validate(mode, { email, password, confirmPassword, code: resetCode }, addressName);
    if (Object.keys(found).length > 0) {
      setFieldErrors(found);
      // Send focus to the first thing that needs fixing, in form order, so keyboard
      // and screen-reader users land on the problem rather than hunting for it.
      const order =
        mode === "reset-request"
          ? (["email"] as const)
          : mode === "reset-verify"
            ? (["code", "password", "confirmPassword"] as const)
            : (["email", "password", "confirmPassword"] as const);
      const idFor = { email: emailId, password: passwordId, confirmPassword: confirmId, code: codeId };
      const firstInvalid = order.find((f) => found[f]);
      if (firstInvalid) document.getElementById(idFor[firstInvalid])?.focus();
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      if (mode === "login" || mode === "register") {
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
      } else if (mode === "reset-request") {
        // Sends the OTP email (see convex/BrevoOTPPasswordReset.ts); doesn't sign
        // anyone in, so no navigation — just advance to the code-entry step.
        await signIn("password", { flow: "reset", email });
        switchMode("reset-verify");
      } else {
        // reset-verification: on success this signs the user in, same as signIn/signUp.
        await signIn("password", { flow: "reset-verification", email, code: resetCode, newPassword: password });
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError(friendlyError(err, addressName, mode));
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputType = reveal ? "text" : "password";
  const errorId = `${emailId}-form-error`;
  const { submitLabel, submittingLabel } = MODE_COPY[mode];

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mb-5 text-center">
        <h2 className="font-serif font-medium text-2xl tracking-[-0.01em]">
          {mode === "register" && `Set up your dose log, ${addressName}`}
          {mode === "login" && `Welcome back, ${addressName}`}
          {mode === "reset-request" && `Reset your password, ${addressName}`}
          {mode === "reset-verify" && `Enter your code, ${addressName}`}
        </h2>
        <p className="mt-1.5 text-sm text-ink-soft">
          {mode === "register" && "Create an account to keep your regimen close."}
          {mode === "login" && "Sign in to pick up where you left off."}
          {mode === "reset-request" && "We'll email a code to get you back in."}
          {mode === "reset-verify" && `We sent a code to ${email}.`}
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
                className={`${inputClass} ${inputRestClass}`}
                placeholder="What should the label say?"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {mode !== "reset-verify" && (
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
              aria-invalid={fieldErrors.email ? true : undefined}
              aria-describedby={fieldErrors.email ? `${emailId}-error` : undefined}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError("email");
              }}
              className={`${inputClass} ${fieldErrors.email ? inputInvalidClass : inputRestClass}`}
              placeholder="doc@apothecary.com"
            />
            {fieldErrors.email && (
              <p id={`${emailId}-error`} className={fieldErrorClass}>
                {fieldErrors.email}
              </p>
            )}
          </div>
        )}

        {mode === "reset-verify" && (
          <div>
            <label htmlFor={codeId} className={labelClass}>
              Reset code
            </label>
            <input
              id={codeId}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              // Matches OTP_LENGTH in convex/BrevoOTPPasswordReset.ts — a UX hint,
              // not validation; the server stays the authority on what's valid.
              maxLength={8}
              value={resetCode}
              autoFocus
              required
              disabled={isSubmitting}
              aria-invalid={fieldErrors.code ? true : undefined}
              aria-describedby={fieldErrors.code ? `${codeId}-error` : undefined}
              onChange={(e) => {
                setResetCode(e.target.value);
                clearFieldError("code");
              }}
              className={`${inputClass} ${fieldErrors.code ? inputInvalidClass : inputRestClass} text-center tracking-[0.3em]`}
              placeholder="12345678"
            />
            {fieldErrors.code && (
              <p id={`${codeId}-error`} className={fieldErrorClass}>
                {fieldErrors.code}
              </p>
            )}
          </div>
        )}

        {mode !== "reset-request" && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor={passwordId} className={labelTextClass}>
                {mode === "reset-verify" ? "New password" : "Password"}
              </label>
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => switchMode("reset-request")}
                  disabled={isSubmitting}
                  className="text-xs text-ink-soft hover:text-ink transition-colors disabled:opacity-60"
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
                autoComplete={mode === "register" || mode === "reset-verify" ? "new-password" : "current-password"}
                required
                disabled={isSubmitting}
                aria-invalid={fieldErrors.password ? true : undefined}
                aria-describedby={fieldErrors.password ? `${passwordId}-error` : undefined}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError("password");
                }}
                className={`${inputClass} ${fieldErrors.password ? inputInvalidClass : inputRestClass} pr-11`}
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
            {fieldErrors.password && (
              <p id={`${passwordId}-error`} className={fieldErrorClass}>
                {fieldErrors.password}
              </p>
            )}
            {(mode === "register" || mode === "reset-verify") && (
              <PasswordStrengthMeter password={password} />
            )}
          </div>
        )}

        <AnimatePresence initial={false}>
          {(mode === "register" || mode === "reset-verify") && (
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <label htmlFor={confirmId} className={labelClass}>
                {mode === "reset-verify" ? "Confirm new password" : "Confirm password"}
              </label>
              <input
                id={confirmId}
                type={inputType}
                value={confirmPassword}
                maxLength={128}
                autoComplete="new-password"
                required
                disabled={isSubmitting}
                aria-invalid={fieldErrors.confirmPassword ? true : undefined}
                aria-describedby={fieldErrors.confirmPassword ? `${confirmId}-error` : undefined}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearFieldError("confirmPassword");
                }}
                className={`${inputClass} ${fieldErrors.confirmPassword ? inputInvalidClass : inputRestClass}`}
                placeholder="••••••••"
              />
              {fieldErrors.confirmPassword && (
                <p id={`${confirmId}-error`} className={fieldErrorClass}>
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {mode === "reset-verify" && (
          <button
            type="button"
            onClick={resendCode}
            disabled={isSubmitting || resendState === "sending"}
            className={backLinkClass}
          >
            {resendState === "sending"
              ? "Sending…"
              : resendState === "sent"
                ? "Sent — check your inbox."
                : "Didn't get a code? Send another."}
          </button>
        )}

        {error && (
          <p
            id={errorId}
            className="flex items-start gap-2 rounded-xl border border-clay-deep bg-clay/60 px-3 py-2 text-sm text-ink"
            role="alert"
          >
            <AlertMark />
            <span>{error}</span>
          </p>
        )}

        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileTap={reduceMotion ? undefined : { scale: 0.95 }}
          className={submitClass}
        >
          {isSubmitting ? submittingLabel : submitLabel}
        </motion.button>

        {mode === "login" && (
          <motion.button
            type="button"
            onClick={() => switchMode("register")}
            disabled={isSubmitting}
            whileTap={reduceMotion ? undefined : { scale: 0.95 }}
            className={backLinkClass}
          >
            {`New here? Create an account, ${addressName}.`}
          </motion.button>
        )}
        {mode === "register" && (
          <motion.button
            type="button"
            onClick={() => switchMode("login")}
            disabled={isSubmitting}
            whileTap={reduceMotion ? undefined : { scale: 0.95 }}
            className={backLinkClass}
          >
            Already have an account? Sign in.
          </motion.button>
        )}
        {mode === "reset-request" && (
          <motion.button
            type="button"
            onClick={() => switchMode("login")}
            disabled={isSubmitting}
            whileTap={reduceMotion ? undefined : { scale: 0.95 }}
            className={backLinkClass}
          >
            Back to sign in.
          </motion.button>
        )}
        {mode === "reset-verify" && (
          <motion.button
            type="button"
            onClick={() => switchMode("reset-request")}
            disabled={isSubmitting}
            whileTap={reduceMotion ? undefined : { scale: 0.95 }}
            className={backLinkClass}
          >
            Use a different email.
          </motion.button>
        )}
      </div>
    </form>
  );
}

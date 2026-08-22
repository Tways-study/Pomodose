/**
 * Password-reset email provider for Convex Auth, sent via the Brevo
 * (formerly Sendinblue) transactional email API.
 *
 * Wired into `convex/auth.ts` as the `reset` option on the `Password`
 * provider. Convex Auth's `Password` provider natively drives the
 * `"reset"` / `"reset-verification"` flows through the existing `signIn`
 * action — this file only supplies *how the OTP email gets sent*, not any
 * new exported Convex functions.
 *
 * `sendVerificationRequest` is invoked by Convex Auth's `signIn` action with
 * no `ctx` of any kind (confirmed by reading
 * `node_modules/@convex-dev/auth/dist/server/implementation/{index,provider_utils}.js`),
 * so this can only ever do plain `fetch()`-based HTTPS calls — no
 * `ctx.runAction`, no Node-runtime bridge, no raw SMTP sockets. Brevo's
 * `POST /v3/smtp/email` REST endpoint is a plain HTTPS/JSON call, which is
 * why it fits here (same reasoning that made the previous Gmail and Resend
 * implementations work) — no SDK needed.
 *
 * This is a SCAFFOLD: no `BREVO_*` env vars are configured on the
 * deployment yet. They're read lazily, inside `sendVerificationRequest`, so
 * importing this module (and therefore `convex/auth.ts`) never throws at
 * build/codegen/push time even with none set. They're only required at the
 * moment a user actually requests a password reset — see the thrown error
 * message below.
 */
import { Email } from "@convex-dev/auth/providers/Email";
import { ConvexError } from "convex/values";

/**
 * Thrown when a password reset is requested but the Brevo env vars haven't
 * been configured on the Convex deployment yet. Kept as a stable,
 * distinctive string so the client can substring-match it (see
 * `friendlyError()` in `components/login-form.tsx`) to show a friendly
 * message instead of a raw Brevo API error.
 */
const NOT_CONFIGURED_MESSAGE = "Password reset is not configured yet.";

/** Length of the numeric OTP code emailed to the user. */
const OTP_LENGTH = 8;

function generateOTP(): string {
  const digits = new Uint32Array(OTP_LENGTH);
  crypto.getRandomValues(digits);
  return Array.from(digits, (n) => n % 10).join("");
}

export const BrevoOTPPasswordReset = Email({
  id: "brevo-otp-password-reset",
  // Not used as a display name anywhere in this app's UI; kept for clarity
  // in Convex Auth's internal provider bookkeeping.
  name: "Brevo password reset OTP",
  // Short-lived: 15 minutes.
  maxAge: 60 * 15,
  // A short numeric code (not a magic-link token), since Password's
  // "reset-verification" flow expects the user to submit a `code`.
  generateVerificationToken: async () => generateOTP(),
  async sendVerificationRequest({ identifier: email, token }) {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    if (!apiKey || !senderEmail) {
      throw new ConvexError(NOT_CONFIGURED_MESSAGE);
    }

    const subject = "Your Apothecary password reset code";
    const textContent = `Your password reset code is ${token}\n\nThis code expires in 15 minutes. If you didn't request a password reset, you can safely ignore this email.`;

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: "Apothecary" },
        to: [{ email }],
        subject,
        textContent,
      }),
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new ConvexError(`Failed to send password reset email: ${responseText}`);
    }
  },
});

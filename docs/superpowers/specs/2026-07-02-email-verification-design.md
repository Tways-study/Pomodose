# Email verification + password reset via Gmail SMTP

## Context

Pomodose's Convex Auth setup (`convex/auth.ts`) currently uses only a `Password` provider with no email confirmation and no self-service password reset — the login page's own copy already says "Password reset isn't set up yet, Doc." Registration accepts any email string with no proof of ownership.

This adds both, using Gmail SMTP (via an App Password) rather than a transactional email API like Resend, since the user already has a Gmail account and no verified sending domain.

## Goals

- New accounts must confirm their email with a 6-digit code before they can sign in (mandatory — confirmed with the user as an acceptable tradeoff despite being a stricter pattern than Pomodose's usual low-friction feel).
- Existing accounts can self-serve a password reset via a 6-digit code sent to their email.
- Emails are sent via Gmail SMTP using an App Password, not a third-party email API.

## Non-goals

- No magic-link flow (code-entry UX only, to stay within the single-page app rather than adding a callback route).
- No custom "resend code" cooldown UI beyond whatever Convex Auth's built-in rate limiting already provides.
- No change to the existing account-recovery copy beyond replacing "not set up yet" with the real flow.

## Architecture

Convex Auth's `Password` provider takes optional `verify` and `reset` config, each just an "email provider" object with a `sendVerificationRequest(params, ctx)` callback. Both will point at the same shared Gmail-OTP sender — no separate code paths for verify vs. reset beyond the subject line.

**Why this shape:** Convex Auth already owns code generation, hashing, storage, and expiry via the `authVerificationCodes`/`authRateLimits` tables (already part of `authTables` in `convex/schema.ts` — no schema changes needed). Per the project's own Convex guidance ("use a provider, not a session table"), we plug into that machinery rather than hand-rolling OTP storage.

**Node runtime split:** `sendVerificationRequest` needs to make a real SMTP connection (`nodemailer`), which requires Node built-ins (`net`/`tls`) unavailable in Convex's default V8-isolate runtime. `convex/auth.ts` must stay on the default runtime (other exports from that file are consumed elsewhere), so the actual send happens in a separate `"use node"` internal action, invoked via `ctx.runAction(...)` from inside the email config's callback (`ctx` is passed as the second argument to `sendVerificationRequest` — confirmed by reading `node_modules/@convex-dev/auth/dist/server/implementation/signIn.js`).

**Code format:** Convex Auth's default token is a 32-character random string (fine for a link, unusable for manual entry). Override `generateVerificationToken` on the email config to produce a 6-digit numeric string instead.

### New/changed files

- `convex/lib/sendOtpEmail.ts` (new, `"use node"`): an `internalAction` taking `{ to: string, code: string, purpose: "verify" | "reset" }`, using `nodemailer.createTransport({ service: "gmail", auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD } })` to send a plain-text + simple HTML email in Pomodose's voice ("Doc" phrasing, not generic "Your verification code is..." boilerplate), subject varying by purpose.
- `convex/GmailOtp.ts` (new): the shared `Email(...)` config from `@convex-dev/auth/providers/Email`, with `maxAge: 60 * 15` (15 min) and a custom `generateVerificationToken` (6-digit), whose `sendVerificationRequest` calls `ctx.runAction(internal.lib.sendOtpEmail.send, { to: identifier, code: token, purpose: ... })`. Purpose can be inferred from `provider.id` if we register it under two ids (`gmail-otp-verify` / `gmail-otp-reset`) pointing at the same underlying factory, or threaded through directly — exact plumbing decided during implementation planning.
- `convex/auth.ts` (modified): add `verify: GmailOtp` and `reset: GmailOtp` to the existing `Password<DataModel>({...})` config.
- `components/login-form.tsx` (modified): new local states for a post-signup "enter your code" step (calls `signIn("password", { flow: "email-verification", email, code })`) and a "forgot password" mini-flow reachable from the sign-in view (`flow: "reset"` → code + new password screen → `flow: "reset-verification"`). Same design-token styling as the rest of the form (paper-2 inputs, lilac focus ring, pill submit button, "Doc" voice, `bg-clay/25` error banner).
- `app/login/page.tsx`: footer copy update — drop "Password reset isn't set up yet, Doc" now that it's real.
- New env vars: `GMAIL_USER`, `GMAIL_APP_PASSWORD` — set via `npx convex env set` on the dev deployment now; documented as a required step on the production deployment later (same "per-deployment env vars" gotcha we already hit with the JWT keys).

## Error handling

- Wrong/expired code: Convex Auth throws from the nested email-provider's `authorize`; map to warm copy in `login-form.tsx` similar to the existing `friendlyError` helper (e.g. "That code didn't match or has expired, Doc — request a new one?").
- SMTP send failure (bad App Password, Gmail rate limit, network error): the `"use node"` action should let the error propagate (not swallow it) so the client sees a failure and can show "Couldn't send that email — try again in a moment, Doc" rather than silently pretending a code was sent.
- Gmail's SMTP relay caps around ~500 sends/day for a regular Gmail account — more than sufficient for a personal app; no special handling needed, just a note in case it's ever hit.

## Testing

- No new Convex schema, so no new Zod/schema tests needed.
- `login-form.tsx`'s new step logic (verify-code screen, reset flow) is UI state machine work — cover with the same patterns as existing component tests if the project has any for `login-form.tsx` today (currently none), otherwise rely on manual browser verification (Playwright, as used for the original Convex migration) since there's no existing component-test harness for this file to extend.
- Manual verification: register a new account, confirm sign-in is blocked pre-verification, receive and enter the real code via Gmail, confirm sign-in unblocks; then exercise "forgot password" end-to-end with a real code.

## Open implementation details (for the plan, not blocking design approval)

- Exact mechanism for threading `purpose` (verify vs. reset) through to the email copy — either two thin wrapper configs sharing one internal action, or a single config with the purpose inferred from which Password option invoked it. Left to implementation planning.
- Gmail App Password setup is a guided, interactive step (2-Step Verification + App Password generation) — happens during implementation, not now.

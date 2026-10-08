# Plan: Remember me on login

**Status:** implemented (email remembering only; the session cookie lifetime is unchanged)

## Goal
When someone signs in again on the same device, make it quick: prefill their email, and let them choose whether the session survives a browser restart.

## Current behavior
- `components/login-form.tsx` calls `signIn("password", { flow, email, password })` from `@convex-dev/auth/react`. Email is not remembered between visits.
- Convex Auth keeps its token client-side (see the comment in `proxy.ts`); session lifetime is Convex Auth's default.
- This is a single-user gift app, so the gate should stay simple.

## Scope
1. **Remember email (default on).** A "Remember me" checkbox under the password field. When checked, store the email in `localStorage` on a successful sign-in; prefill the email input on the next visit and focus the password field.
2. **Forget on uncheck.** Unchecking and signing in clears the stored email. Signing out keeps it (the whole point), but the profile menu offers no extra control.
3. **Never store the password.** Browser password managers handle that: keep `autoComplete="email"` and `autoComplete="current-password"`.

## Out of scope
- Longer or shorter server session lifetimes (revisit only if the default expires too often; Convex Auth `session.totalDurationMs` in `convex/auth.ts`).
- Any "trusted device" or token storage of our own.

## Implementation notes
- New `lib/remembered-email.ts`: `readRememberedEmail()`, `saveRememberedEmail(email)`, `clearRememberedEmail()`. Wrap every `localStorage` access in try/catch (private windows throw) and log, no empty catch. Guard `typeof window === "undefined"`. Mirror the shape of `lib/rate-limit-storage.ts`.
- Read the stored value in a post-mount `useEffect`, not during render, to avoid a hydration mismatch (same rule as `address-term-provider.tsx`).
- Only the `login` mode shows the checkbox; register and reset flows don't.
- Checkbox: 44px target, visible label, `accent` from tokens, no hardcoded hex. Sentence-case label "Remember me on this device".
- Save/clear only after `signIn` resolves, so a failed attempt changes nothing.

## Tests
- Unit test `lib/remembered-email.ts` (save, read, clear, storage throwing).
- Manual: sign in checked, reload `/login`, email prefilled; sign in unchecked, email gone; storage blocked, form still works.

## Done when
- Email prefills on return visits and the choice is respected.
- No password or token is written by our code.
- `npm run lint && npm run typecheck && npm test && npm run build` pass.

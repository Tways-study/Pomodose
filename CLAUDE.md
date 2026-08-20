# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev         # start dev server (localhost:3000)
npm run build        # production build
npm run lint         # eslint (flat config, eslint-config-next)
npm run typecheck    # tsc --noEmit
npm test             # vitest run (single run, used in CI)
npm run test:watch   # vitest watch mode
```

Run a single test file: `npx vitest run lib/dosey.test.ts`
Run tests matching a name: `npx vitest run -t "includes the dose count"`

CI (`.github/workflows/ci.yml`) runs lint → typecheck → test → build in that order on every push/PR to `main`. Match that order locally before pushing.

## Architecture

This is "Apothecary" (package name `pomodose`), a single-page Pomodoro timer + daily goal tracker + AI chat companion ("Dosey"), themed for a pharmacist. It's a personal single-user gift app, not multi-tenant SaaS — login/register is a personal access gate, not account infrastructure for many users (see `PRODUCT.md`). The main app lives on one route (`app/page.tsx`); the only other routes are `app/login/page.tsx` and the `app/api/chat/route.ts` API route. `app/error.tsx` is a themed client-side error boundary (Next's `error.tsx` convention) for uncaught render errors, not a route.

**This Next.js version has real breaking changes from training-data Next.js — read `AGENTS.md` before touching routing/middleware.** Concretely: there is no `middleware.ts`; route gating lives in `proxy.ts` at the repo root and exports `proxy` (not `middleware`). Check `node_modules/next/dist/docs/` for anything else that looks off versus what you expect.

**Auth and goal persistence run on Convex** (`convex/`), not localStorage. `convex/schema.ts` defines `goals` (indexed `by_user_and_date`) alongside `@convex-dev/auth`'s `authTables`. `convex/auth.ts` configures a **password-only** provider — no email verification or reset flow, so no external mail provider is required; accounts are created and signed in immediately (server-side email format re-validation happens in `validateEmail` since the mutation is reachable directly, bypassing the client's `<input type="email">`). `convex/goals.ts` mutations/queries all call `getAuthedUserId` (`convex/lib/auth.ts`) and check row ownership before mutating. **`convex/_generated/` is committed to git** (see the "Commit convex/_generated/" commit) so CI can typecheck Convex code without running `convex dev`/`codegen` first — regenerate and commit it after schema/function changes. Client-side, `app/ConvexClientProvider.tsx` wraps the app in `ConvexAuthNextjsProvider`, and `proxy.ts` redirects unauthenticated requests to `/login` (JSON 401 for `/api/*`).

**State lives in `app/page.tsx` and flows down, except goals.** The timer is a `useReducer` over `lib/timer-machine.ts`, held only in page state — `dailyDoses`/`focusCycle`/phase are **not** persisted anywhere and reset on reload. Goals are a Convex live query owned by `components/goal-list.tsx` (and independently re-queried by `components/dosey-chat.tsx` for chat context); `goal-list.tsx` reports aggregate done/total counts up to the page via an `onProgressChange` callback. There is no global store — if a component needs timer state, it must be passed as props from the page; goal state is fetched directly wherever it's needed via `useQuery(api.goals.*)`.

**Timer is timestamp-driven, not tick-decremented.** `lib/timer-machine.ts` is a pure reducer keyed on `Date.now() + startedAt`; `remaining` is recomputed from the elapsed wall-clock time on every `TICK`, not decremented by 1 each second. This keeps the countdown accurate when the tab is backgrounded/throttled. Any change to timer logic must preserve this invariant (see the existing tests in `lib/timer-machine.test.ts`).

**Goals are scoped by a client-computed `date` field, not server-side rollover.** `lib/date.ts`'s `todayKey()` produces `YYYY-MM-DD`; `goal-list.tsx` queries `api.goals.list` for today's key, so switching days just queries a different (empty) bucket — old goals aren't deleted, they simply stop showing. The 80-char text cap is enforced both client-side (`goal-list.tsx`'s `<input maxLength={80}>`) and server-side (`convex/goals.ts`'s `MAX_GOAL_TEXT_LENGTH`), since the mutation is reachable directly, bypassing the form.

**Dosey (AI chat) is a thin proxy to Gemini, not a stateful backend.** `app/api/chat/route.ts` is the only API route: it Zod-validates `{ messages, stats, goals }` from the client, applies a per-IP daily rate limit (see below), builds a system instruction from `lib/dosey.ts` (persona + `buildContextBlock`, which renders the live timer/goal snapshot as text), and streams `@google/genai`'s `generateContentStream` output back as a raw text stream (no SSE framing — the client reads the stream directly). Requires `GEMINI_API_KEY`; the route returns a 500 with a user-facing message if it's missing rather than throwing. `components/dosey-chat.tsx` owns chat message history client-side and re-sends the full history + current stats/goals on every message — the server is stateless per request. `lib/chat-history.ts`'s `trimHistory` caps what's sent/kept to the most recent messages and is used both client- and server-side.

**Chat rate limiting is in-memory and per-server-instance, by design.** `lib/rate-limit.ts` splits a pure decision function (`evaluateRateLimit`, unit-testable like `timerReducer`) from a stateful `Map`-backed wrapper (`consumeRateLimit`) — the module comment explains this resets on redeploy/restart and isn't a global quota on serverless multi-instance hosting, which is accepted for this project's scale. `lib/rate-limit-storage.ts` mirrors the "resting until" state into `localStorage` purely so the client UI can show/hide the composer without a request; it's not the source of truth.

**Types are centralized in `types/index.ts`**, not colocated with modules: `Phase`, `TimerStatus`, `TimerState`, `Goal`, `ChatMessage`, `DoseyStats`, `DoseyRateLimitState`, `ChatRateLimitError`. When adding a field to timer or goal state, update this file first, then the Zod schemas that mirror it (`app/api/chat/route.ts`'s `statsSchema`/`goalSchema`) and the Convex validators in `convex/schema.ts`/`convex/goals.ts` — these are hand-kept in sync with the TS types, not generated from them.

**Design tokens live only in `tailwind.config.ts`.** Colors (`paper`, `ink`, `lilac`, `lilac-deep`, `sage`, `clay`, `line`, etc.), fonts (`font-serif` = Fraunces, `font-sans` = Spline Sans), and `rounded-card` are the only palette/typography vocabulary components should use — no hardcoded hex values or alternate typefaces (no Inter/Roboto/Arial) in components. `PRODUCT.md` and `DESIGN.md` cover brand voice/anti-references and detailed design rationale.

**The vial timer (`components/vial-timer.tsx`) is the signature UI element** — an SVG vial with a clipped liquid `<rect>` animated via Framer Motion, where `remaining/total` drives the liquid height between fixed `VIAL_TOP`/`VIAL_BOTTOM` coordinates. It is intentionally not a circular progress ring; do not replace it with one.

## Constraints from the original build spec

These still apply:

- No `any` in TypeScript; no empty `catch` blocks.
- Respect `prefers-reduced-motion` in animated components (see the reduced-motion fallback in `quote-card.tsx`).
- Restraint over feature bloat — one concern per file, no unrelated additions.

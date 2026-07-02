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

This is "Apothecary" (package name `pomodose`), a single-page Pomodoro timer + daily goal tracker + AI chat companion ("Dosey"), themed for a pharmacist. Everything lives under one route (`app/page.tsx`); there is no routing beyond the chat API.

**State lives in `app/page.tsx` and flows down.** The timer is a `useReducer` over `lib/timer-machine.ts`; goals live inside `components/goal-list.tsx` and report aggregate counts back up via an `onProgressChange` callback. There is no global store — if a component needs timer or goal state, it must be passed as props from the page.

**Timer is timestamp-driven, not tick-decremented.** `lib/timer-machine.ts` is a pure reducer keyed on `Date.now() + startedAt`; `remaining` is recomputed from the elapsed wall-clock time on every `TICK`, not decremented by 1 each second. This keeps the countdown accurate when the tab is backgrounded/throttled. Any change to timer logic must preserve this invariant (see the existing tests in `lib/timer-machine.test.ts`).

**Goal persistence rolls at local midnight.** `lib/storage.ts` stores goals in `localStorage` under a single key, validated through a Zod schema (`PersistedGoalsSchema`) on read — never trust raw `JSON.parse`. Storage is keyed by a `date` field (`YYYY-MM-DD`); on load, if the stored date doesn't match today, goals reset to empty. Any storage schema change needs a matching Zod schema update and should consider the date-rollover behavior.

**Dosey (AI chat) is a thin proxy to Gemini, not a stateful backend.** `app/api/chat/route.ts` is the only API route: it Zod-validates `{ messages, stats, goals }` from the client, builds a system instruction from `lib/dosey.ts` (persona + `buildContextBlock`, which renders the live timer/goal snapshot as text), and streams `@google/genai`'s `generateContentStream` output back as a raw text stream (no SSE framing — the client reads the stream directly). Requires `GEMINI_API_KEY` in `.env.local`; the route returns a 500 with a user-facing message if it's missing rather than throwing. `components/dosey-chat.tsx` owns chat message history client-side and re-sends the full history + current stats/goals on every message — the server is stateless per request.

**Types are centralized in `types/index.ts`**, not colocated with modules: `Phase`, `TimerStatus`, `TimerState`, `Goal`, `PersistedGoals`, `ChatMessage`, `DoseyStats`. When adding a field to timer or goal state, update this file first, then the Zod schemas that mirror it (`lib/storage.ts`'s `GoalSchema`/`PersistedGoalsSchema`, and `app/api/chat/route.ts`'s `statsSchema`/`goalSchema`) — these are hand-kept in sync with the TS types, not generated from them.

**Design tokens live only in `tailwind.config.ts`.** Colors (`paper`, `ink`, `lilac`, `lilac-deep`, `sage`, `clay`, `line`, etc.), fonts (`font-serif` = Fraunces, `font-sans` = Spline Sans), and `rounded-card` are the only palette/typography vocabulary components should use — no hardcoded hex values or alternate typefaces (no Inter/Roboto/Arial) in components.

**The vial timer (`components/vial-timer.tsx`) is the signature UI element** — an SVG vial with a clipped liquid `<rect>` animated via Framer Motion, where `remaining/total` drives the liquid height between fixed `VIAL_TOP`/`VIAL_BOTTOM` coordinates. It is intentionally not a circular progress ring; do not replace it with one.

## Notes from the original build spec (`CLAUDE_CODE_PROMPT.md`)

This file documents the original from-scratch spec used to bootstrap the app and still reflects real constraints:

- No backend/auth/database beyond the Dosey chat route.
- No `any` in TypeScript; no empty `catch` blocks.
- Respect `prefers-reduced-motion` in animated components (see the reduced-motion fallback in `quote-card.tsx`).

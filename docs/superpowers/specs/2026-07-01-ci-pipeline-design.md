# CI Pipeline — Design

**Date:** 2026-07-01
**Project:** Pomodose (Next.js 16.2.9, React 19, TypeScript, Tailwind)
**Remote:** github.com/Tways-study/Pomodose

## Goal

Add an automated CI pipeline that runs on every push/PR and gates a Vercel
deploy behind passing quality checks. Also introduce a unit-test setup, since
the project currently has none.

## Scope

- Lint, typecheck, unit tests, and production build on push + PR.
- Vitest + React Testing Library test setup with real starter tests for `lib/`.
- Vercel deploy (preview on PR, production on `main`) via the Vercel CLI.

## Existing state to fix

- Dead workflow at `.github/.workflows/test.yaml` (leading dot in dir name +
  empty file) — GitHub only reads `.github/workflows/`. Delete it.
- No `test` or `typecheck` script; no test framework installed.

## Workflow: `.github/workflows/ci.yml`

**Triggers**
- `pull_request` → checks
- `push` to `main` → checks

**Job `quality`** (push + PR)
1. `actions/checkout@v4`
2. `actions/setup-node@v4` (Node 20, `cache: npm`)
3. Restore Next build cache via `actions/cache@v4` on `.next/cache`
   (key from `package-lock.json` + source hashes, per Next.js CI docs)
4. `npm ci`
5. `npm run lint`
6. `npm run typecheck`
7. `npm test`
8. `npm run build`

**Deploy (deferred)**
- CD to Vercel is intentionally out of scope for now; to be added later.

## Test setup (Vitest + RTL)

Per the bundled Next.js Vitest guide:
- devDeps: `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`,
  `@testing-library/dom`, `@testing-library/jest-dom`, `vite-tsconfig-paths`.
- `vitest.config.mts`: `plugins: [tsconfigPaths(), react()]`, `environment: jsdom`,
  `setupFiles` for jest-dom matchers.
- `vitest.setup.ts`: `import "@testing-library/jest-dom/vitest"`.
- Scripts: `test` = `vitest run`, `test:watch` = `vitest`, `typecheck` = `tsc --noEmit`.

**Starter tests** (real assertions):
- `lib/timer-machine.test.ts` — reducer transitions: START/PAUSE/RESUME guards,
  RESET, SET_PHASE durations, COMPLETE cycling focus→short and every 4th→long,
  daily-dose increment.
- `lib/storage.test.ts` — load/save round trip under jsdom, date-roll returns
  empty on stale date, malformed JSON returns empty.

## Non-goals

- E2E/browser tests.
- Coverage gating/thresholds.
- Multi-version Node matrix.

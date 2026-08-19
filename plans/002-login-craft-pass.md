# 002 — Login/signup page craft pass

- **Status**: DONE
- **Commit**: 371df71
- **Severity**: N/A (craft/polish, not a correction)
- **Category**: typography, motion, elevation
- **Estimated scope**: 2 files, 5 edits

## Problem

`components/login-form.tsx` and `app/login/page.tsx` already functioned correctly and were on-voice and on-palette, but under-crafted relative to the rest of the app: zero entrance motion anywhere (everything popped in instantly), a headline under-scaled relative to `DESIGN.md`'s own documented Display typography spec, the system's weakest shadow tier on what should be the app's one "arrival" moment, and no ambient life to the background beyond the generic always-on global wash.

`DESIGN.md` explicitly permits "a single centered card at most" as the sanctioned register for a login/access gate — the centered-card silhouette was never the problem, the flatness of its execution was. This pass elevates craft inside that sanctioned register rather than replacing the architecture.

## Target / what shipped

### `app/login/page.tsx` — converted to a Client Component with entrance choreography + ambient glow

- Added `"use client"` (was a server component; Framer Motion requires client).
- Added a `relative overflow-hidden` root, a `pointer-events-none absolute inset-0 z-0` ambient glow behind everything, and a `relative z-10` content wrapper — the same stacking pattern used for the running-timer's ambient wash (plan 001), to avoid `position: absolute`/`fixed` painting above normal content regardless of DOM order.
- Ambient glow: `radial-gradient(50% 50% at 50% 38%, #C9B6E4 0%, transparent 65%)`, breathing opacity `[0.08, 0.16, 0.08]` on `3.5s easeInOut infinite` — the *exact same cadence* as plan 001's running-wash, reused deliberately for cross-page cohesion (the product breathes from the very first screen). Always on here, unlike the running-wash, since login has no analogous on/off state.
- Entrance: header block → card → footer, staggered `0ms / 90ms / 160ms`, each `opacity:0, y:12, filter:"blur(4px)"` → `opacity:1, y:0, filter:"blur(0px)"`, `duration:0.5`, `ease: EASE_OUT` — reusing `quote-card.tsx`'s existing blur-lift entrance recipe rather than inventing a new one.
- Card shadow upgraded from the `card` token to the `panel` token (`0 1px 0 white inset, 0 18px 50px -24px rgba(46,36,51,.35)`) — DESIGN.md's own documented "genuinely lifted" tier, reused here rather than inventing a fourth tier.
- Reduced motion: opacity-only fade (no `y`/`blur`) for entrance, static 0.12 opacity for the glow (no breathing loop) — matches the established codebase pattern.

### `components/login-form.tsx` — headline scale correction (one line)

- `<h2 className="font-serif font-semibold text-xl">` → `<h2 className="font-serif font-medium text-2xl tracking-[-0.01em]">`, matching `DESIGN.md`'s documented Display tier exactly (this greeting functions as the auth card's panel header).

## Repo conventions followed

- Reused `EASE_OUT` from `lib/motion.ts` rather than inventing a new curve.
- Reused the exact `panel` shadow value from `DESIGN.md` verbatim.
- Reused the exact ambient-glow/breathing-cadence recipe and `relative z-10`/`z-0` stacking pattern from plan 001's running-wash.
- Matched `quote-card.tsx`'s reduced-motion fallback shape (opacity-only, dropping `y`/`filter`).

## Boundaries respected

- `LoginForm`'s internal form logic, validation, copy, and existing button/field motion untouched.
- No continuous motion added to the card itself — only a one-time entrance. The atmosphere breathes; the card stays the steady anchor.
- No new shadow tier, no new color (glow uses the existing `lilac` hex, matching the running-wash exactly).
- No tick-mark texture layer — user explicitly declined it.
- `app/error.tsx` (shares this exact template) left untouched — out of scope for this request; see "Not doing" in `plans/README.md`.

## Verification

- **Mechanical**: `npm run lint`, `npm run typecheck`, `npm test` (49 passed), `npm run build` — all passed clean. `/login` route still builds correctly as a dynamic route after the server→client component conversion.
- **Live check** (this session, via Playwright against the dev server — no auth needed to view this page):
  - Confirmed zero console errors on load and after the register-mode toggle.
  - Confirmed layout: headline reads at the corrected Display scale, card shadow visibly more present, ambient glow visible behind the card blending into the page.
  - Confirmed the existing register-mode toggle (name/confirm-password `AnimatePresence` height animation) still works correctly nested inside the new entrance wrapper — no interference.
  - **Not verified**: `prefers-reduced-motion` toggle — the Playwright MCP tools available in this session don't expose CDP-level media emulation (`page.emulateMedia`), only page-context JS, which can't override the media query from inside the page. This remains a manual DevTools check.
  - **Not verified**: the glow's `50% 38%` vertical centering across very short/very tall viewports, and whether the 90ms/160ms stagger timing feels right subjectively — both flagged in the original plan as feel-checks, not citations.

## Not doing (yet)

- `app/error.tsx` shares this exact centered-card template and would be a natural candidate for the same treatment — not requested, not done here.

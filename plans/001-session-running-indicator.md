# 001 — Vial running-halo + page ambient wash

- **Status**: DONE (mechanical verification passed; live feel-check deferred to the user)
- **Commit**: 7206976
- **Severity**: N/A (new feature, not a correction)
- **Category**: motion
- **Estimated scope**: 2 files, 6 edits

## Problem

Pomodose's vial timer has no ambient signal for "a session is actively running." The liquid rect only visibly moves once per 1-second tick and is otherwise static — at-a-glance it looks identical whether running or paused. No other element in the app is keyed off `state.status === "running"` for a visual/motion effect.

## Target

Two coordinated pieces, sharing one breathing cadence (3.5s, `easeInOut`) so they read as one system, not two independent effects.

### Part 1 — Vial halo (`components/vial-timer.tsx`)

```tsx
{/* inside <defs>, alongside the vessel clipPath */}
<filter id="vial-glow" x="-50%" y="-50%" width="200%" height="200%">
  <feGaussianBlur stdDeviation="8" />
</filter>
```

```tsx
{/* first painted shape inside <svg>, after </defs> */}
<motion.circle
  cx={90}
  cy={124}
  r={78}
  className="fill-lilac"
  filter="url(#vial-glow)"
  initial={false}
  animate={{ opacity: haloOpacity }}
  transition={haloTransition}
/>
```

```tsx
const isRunning = state.status === "running";
const haloOpacity = reduceMotion
  ? (isRunning ? 0.2 : 0)
  : (isRunning ? [0.15, 0.3, 0.15] : 0);
const haloTransition = !reduceMotion && isRunning
  ? { duration: 3.5, repeat: Infinity, ease: "easeInOut" as const }
  : { duration: 0.3, ease: "easeOut" as const };
```

### Part 2 — Page ambient wash (`app/page.tsx`)

```tsx
const reduceMotion = useReducedMotion();
const isRunning = timer.status === "running";
const ambientOpacity = reduceMotion
  ? (isRunning ? 0.06 : 0)
  : (isRunning ? [0.04, 0.1, 0.04] : 0);
const ambientTransition = !reduceMotion && isRunning
  ? { duration: 3.5, repeat: Infinity, ease: "easeInOut" as const }
  : { duration: 0.4, ease: "easeOut" as const };
```

```tsx
<motion.div
  aria-hidden
  className="pointer-events-none fixed inset-0 z-0"
  style={{ background: "radial-gradient(55% 45% at 8% 108%, #C9B6E4 0%, transparent 70%)" }}
  initial={false}
  animate={{ opacity: ambientOpacity }}
  transition={ambientTransition}
/>
```
positioned as the first element of a fragment, with the existing content wrapped in `<div className="relative z-10 ...">` so it stacks above the wash.

## Repo conventions followed

- Fill color via Tailwind class (`className="fill-lilac"`), matching every other filled shape in `vial-timer.tsx`.
- Ambient infinite loops use the built-in `"easeInOut"` string, not the custom `EASE_OUT` cubic-bezier (reserved for enter/exit tweens) — matches `components/dosey-chat.tsx:196-198`, the codebase's existing idle-bob precedent.
- `useReducedMotion()` gating pattern, per-component, matching every other animated component in the app.

## Steps taken

1. Added the `vial-glow` filter to `vial-timer.tsx`'s `<defs>`.
2. Added the halo `<motion.circle>` as the first painted shape inside the `<svg>`.
3. Added `isRunning`/`haloOpacity`/`haloTransition` derivations near the existing `liquidTransition`.
4. Added `useReducedMotion` to `page.tsx`'s `framer-motion` import.
5. Added `reduceMotion`/`isRunning`/`ambientOpacity`/`ambientTransition` derivations in `Home()`.
6. Restructured `page.tsx`'s `return`: wrapped in a fragment, added the ambient wash as the first element, added `relative z-10` to the existing content container.

## Boundaries respected

- Blur radius (`stdDeviation`) and gradient stops are never animated — opacity only, both effects.
- Vial glow position/size doesn't vary by vessel (flask vs. cylinder) — one shared circle.
- `app/globals.css`'s existing static top-right gradient is untouched — the two washes coexist.
- No Tailwind `keyframes`/`animation` config added — both effects stay inline Framer Motion.
- Both cadences share `duration: 3.5, ease: "easeInOut"` by design — retune together if ever adjusted.

## Verification

- **Mechanical**: `npm run lint`, `npm run typecheck`, `npm test` (49 passed), `npm run build` — all passed clean.
- **Feel check**: deferred — the user chose to eyeball it themselves after pulling rather than have this session drive a Playwright session against the authenticated app. Open items for whoever checks it:
  - Do the two effects read as one coordinated breath, or as two unrelated things happening near each other?
  - Does 3.5s feel calm or sluggish?
  - Does the combined effect stay restrained, or does it compete with the vial/content for attention? (If so: lower the opacity ceilings, don't change the direction — it was deliberately chosen.)
  - Reduced-motion toggle: both effects should become static, non-animated presences while running, and disappear when not.

## Known settled-decision exception

Both effects intentionally use a soft glow — a deliberate exception to `DESIGN.md`'s otherwise whisper-shadow-only, "nearly flat" elevation language. This was explicitly flagged during design-loop's Stage 1 critique and approved by the user afterward. **Not yet documented in `DESIGN.md`** — worth a follow-up one-line note there so a future `design-loop` run doesn't re-flag it as unexplained drift.

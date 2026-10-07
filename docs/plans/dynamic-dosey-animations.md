# Plan: Dynamic Dosey animations while a session runs

**Status:** superseded by implementation (see `lib/dosey-motion.ts` and `components/dosey/`)

## Goal
Dosey should visibly react to what the timer is doing: one behavior while a focus session runs, a different one while a break runs, so the mascot feels alive without distracting from work.

## Current behavior
- `lib/dosey-mood.ts` derives a `DoseyMood` (`sleepy | focused | relaxed | proud`) from phase and status; `components/dosey/use-dosey-mood.ts` exposes it.
- `components/dosey/dosey-rig.tsx` is the GSAP-rigged SVG (variants `full`, `face`, `peek`) with idle blink and breathe loops gated by IntersectionObserver and `withMotion` (reduced motion).
- `components/dosey/dosey-peek.tsx` sits over the timer card in `app/page.tsx`.

## Proposed behavior
**Focus running** (calm, low-distraction):
- Eyes narrow slightly; slower, shallower breathing.
- Tiny sprout sway tied to progress, e.g. one leaf lift each quarter of the session.
- Occasional slow blink; no bouncing. Pointer-tracking eyes stay off so the mascot doesn't pull attention.

**Break running** (playful):
- Relaxed eyes, a gentle bob, leaves flutter.
- Short break: sips and stretches (one-shot cycle every ~20 s). Long break: sleepy yawn, slow sway.
- Pointer tracking allowed again.

**Transitions:** a quick ease between poses when the phase flips (not a snap), plus the existing completion celebration.

**Paused / idle:** return to the current resting pose.

## Implementation notes
- Extend `DoseyMood` or add a `DoseyActivity` (`idle | focus | shortBreak | longBreak`) next to it in `lib/dosey-mood.ts` as a pure function with unit tests; the hook passes it to the rig.
- In `dosey-rig.tsx`, add the new loops inside the existing `withMotion(...)` setup so reduced motion gets static poses, and keep them behind the IntersectionObserver gate so offscreen rigs run nothing.
- Each loop is a timeline created in `useGSAP` scope and killed on activity change; never drive one element with two timelines (see CLAUDE.md motion rules). Animate `transform`/`opacity` only.
- Keep the `face` variant (size < 40) static.
- Durations stay in `lib/motion.ts` constants; colors only from `dosey-*` tokens.
- Respect hidden tab: pause loops on `document.visibilityState === "hidden"`.

## Tests and checks
- Unit tests for the activity resolver across phase/status combinations.
- Manual: run focus and both break types at desktop and 320px; verify no jank, loops stop when scrolled offscreen, `prefers-reduced-motion` shows static poses, and the `review-animations` standards (frequency-appropriate, ease-out, under 300ms for transitions) hold.

## Open questions
- Should the focus animation tie to remaining time (progress-linked) or just loop?
- Do we want a setting to turn Dosey's animation down independent of OS reduced motion?

## Done when
- Distinct focus and break behaviors are visible and calm.
- No extra CPU while offscreen, hidden, or reduced-motion.
- `npm run lint && npm run typecheck && npm test && npm run build` pass.

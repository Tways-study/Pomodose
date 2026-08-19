# Plans

Design-loop plans for Pomodose. Each plan is self-contained — see [`design-loop`'s PLAN-TEMPLATE.md](file://C:/Users/user/.claude/skills/design-loop/PLAN-TEMPLATE.md) for the format.

## Plans

| # | Title | Severity | Category | Status |
| --- | --- | --- | --- | --- |
| [001](001-session-running-indicator.md) | Vial running-halo + page ambient wash | N/A (new feature) | motion | DONE |
| [002](002-login-craft-pass.md) | Login/signup page craft pass | N/A (craft/polish) | typography, motion, elevation | DONE |

## Execution order / dependencies

002 reuses 001's ambient-glow recipe (same `3.5s easeInOut` cadence, same `relative z-10`/`z-0` stacking pattern) — if 001's cadence or stacking approach is ever retuned, revisit 002 too so the two don't drift apart.

## Not doing

Nothing rejected yet. This section records findings a design-loop run proposed that the user declined, with the reason, so future runs don't re-raise them.

- **002 — tick-mark texture layer.** A background direction considered alongside the breathing glow (a faint repeating measurement-tick pattern echoing the vial's own graduation lines). Declined by the user in favor of the simpler glow-only treatment — lower risk, and textures are hard to judge from source alone.
- **002 — `app/error.tsx` craft pass.** Shares the exact same centered-card template as the login page and would be a natural candidate for the same treatment. Not rejected, just not requested — worth raising next time that surface comes up.

## Known settled-decision exceptions

- **Soft glow / blur, used by 001 and 002.** `DESIGN.md`'s elevation language is otherwise whisper-shadow-only ("nearly flat," ink-tinted rgba shadows, no glow). Plan 001 introduced two low-opacity glow effects as a deliberate, user-approved exception, flagged at critique time; plan 002 reuses the same recipe on the login page for cohesion. Not yet reflected in `DESIGN.md` itself — now used in two places, worth a one-line addition there.
- **002 — `panel` shadow tier reused for the login card.** `DESIGN.md` describes `panel` as "the app's one genuinely lifted surface" (previously only the open Dosey chat panel). Plan 002 reuses that same token for the login card rather than inventing a fourth tier — a deliberate, documented choice, not drift.

# Plans

Design-loop plans for Pomodose. Each plan is self-contained — see [`design-loop`'s PLAN-TEMPLATE.md](file://C:/Users/user/.claude/skills/design-loop/PLAN-TEMPLATE.md) for the format.

## Plans

| # | Title | Severity | Category | Status |
| --- | --- | --- | --- | --- |
| [001](001-session-running-indicator.md) | Vial running-halo + page ambient wash | N/A (new feature) | motion | DONE |

## Execution order / dependencies

Just the one plan so far — no ordering constraints yet.

## Not doing

Nothing rejected yet. This section records findings a design-loop run proposed that the user declined, with the reason, so future runs don't re-raise them.

## Known settled-decision exceptions

- **Soft glow / blur, used by 001.** `DESIGN.md`'s elevation language is otherwise whisper-shadow-only ("nearly flat," ink-tinted rgba shadows, no glow). Plan 001 introduces two low-opacity glow effects as a deliberate, user-approved exception — flagged at critique time, chosen anyway. Not yet reflected in `DESIGN.md` itself; worth a one-line addition there if this becomes a recurring pattern rather than a one-off.

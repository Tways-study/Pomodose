# Product

## Register

product

## Users

A single pharmacist (the person this app was built as a gift for), studying and working through focused sessions. They open the app during a study/work block, run Pomodoro-style focus sessions ("doses"), track a short list of daily goals, and occasionally check in with the AI companion Dosey for encouragement or quick study help. This is a personal tool for one person's daily use, not a multi-tenant product — a login/register surface here is a personal access gate (keep unwanted visitors out), not multi-user account infrastructure.

## Product Purpose

Pomodose ("Apothecary") is a Pomodoro focus timer, daily goal tracker, and AI study companion themed around a pharmacist's daily dosing routine. Success looks like: sessions stay accurate even when backgrounded, goals persist and roll over cleanly at midnight, and every interaction feels like a warm, personal gift rather than a generic productivity SaaS tool.

## Brand Personality

Warm, editorial, apothecary-calm — gentle precision rather than corporate efficiency. The voice speaks directly to "Doc" in short, sincere lines ("take as directed," "each session is a measured dose," "the pharmacist's creed"). Fraunces serif carries the editorial warmth; Spline Sans keeps functional UI text clean. The palette (paper, muted lilac, sage, clay) is soft and considered, never saturated or loud.

## Anti-references

Not a generic SaaS login (centered white card on a gradient, cold corporate sans-serif, "Sign in to your account" boilerplate). Not gamified productivity-app chrome (streak counters, badges, confetti). Not clinical/hospital-sterile. Not a dashboard cliché with sidebar nav and stat cards — this app is one calm page, and any new surface should stay in that spirit.

## Design Principles

- Restraint over feature bloat — "one concern per file," no unrelated additions (from the project's own build spec).
- The vial timer and Dosey mascot are the app's signature visual marks; never fall back to generic circular progress bars or stock iconography.
- Editorial typography is the personality: Fraunces for headings/voice moments, Spline Sans for functional text, no Inter/Roboto/system-default anywhere.
- Copy is personal and specific ("Doc," "doses," "the pharmacist's creed"), never generic SaaS copy.
- Motion is calm and intentional (soft floats, gentle spring transitions), always with a `prefers-reduced-motion` fallback.

## Accessibility & Inclusion

WCAG AA baseline, matching what's already implemented across the app: ≥4.5:1 text contrast, visible focus rings (`:focus-visible` with the lilac-deep outline already defined in `globals.css`), full keyboard operability, `aria-label`/`aria-pressed` on icon-only and toggle controls, and a `prefers-reduced-motion` fallback for every animation.

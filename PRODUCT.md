# Product

## Register

product

## Users

Pharmacy students first: people studying for coursework, labs and practicals, OSCEs, and board or licensure exams, working in focused sessions. Many won't know the Pomodoro technique or the dose/refill/antidote metaphor, and aren't "Doc" yet, so the app explains itself in plain words. Licensed pharmacists reviewing material or doing CE are welcome secondary users. They open the app during a study block, run focus sessions ("doses"), track a short list of daily goals, and occasionally check in with the AI companion Dosey for encouragement or study help. This is a personal tool, not a multi-tenant product: a login/register surface here is a personal access gate (keep unwanted visitors out), not multi-user account infrastructure.

## Product Purpose

Pomodose ("Apothecary") is a Pomodoro focus timer, daily goal tracker, and AI study companion themed around a pharmacy's dosing routine, built for pharmacy students. Success looks like: sessions stay accurate even when backgrounded, goals persist and roll over cleanly at midnight, and every interaction feels like a warm, personal gift rather than a generic productivity SaaS tool.

## Brand Personality

"Gelcap Pastel": a pharmacy made of gumdrops and gelcaps. Warm, cute, bubbly and loveable, but still encouraging and never babyish. A gentle peach page carries warm-white pill-shaped cards, and soft pastel "gum" stickers are the only source of color (each sticker means one thing: sky for focus, mint for refill and completion, apricot for antidote and warnings, butter for nudges, rose for remove/undo, lilac for Dosey). Everything is a pill, pebble or bubble: rounded, soft-edged, plum-ink text, sentence case. The voice speaks directly to the user (by a playful address term such as "Doc") in short, sincere lines ("take as directed," "each session is a measured dose"). It is warm, encouraging and theme-playful, never condescending, and never assumes a licence, a dispensing counter, or a work shift; pharmacy students come first, pharmacists are welcome too. Fredoka (rounded display) carries headings, buttons and timer digits; Nunito carries body copy.

## Anti-references

Not a generic SaaS login (centered white card on a gradient, cold corporate sans-serif, "Sign in to your account" boilerplate). Not gamified productivity-app chrome (streak counters, badges, confetti). Not clinical/hospital-sterile. Not a dashboard cliché with sidebar nav and stat cards; this app is one calm page, and any new surface should stay in that spirit. Not hard-edged or black-outlined. Not all-caps or monospace "tech label" typography. Not a generic pastel-SaaS card grid: pastel is earned by meaning (each gum color says one thing), not sprinkled as decoration.

## Design Principles

- Restraint over feature bloat: "one concern per file," no unrelated additions (from the project's own build spec).
- The vial timer and Dosey mascot are the signature marks and stay custom; never fall back to generic circular progress bars. `lucide-react` is the icon set for everything else. The mascot also serves as the brand mark (header, login) and follows the ip-as-logo rules: flat outline-free shapes, a few large blunt rounded forms, three semantic colors, a big head with tiny wide-set dot eyes and blush cheeks, always upright.
- Soft typography is the personality: Fredoka for display text and numbers, Nunito for body copy, sentence case; no Inter/Roboto/system-default, no monospace.
- Rounded everything: cards, controls, buttons, stickers and progress are bubbles, inputs and rows are soft rounded rectangles, pills for buttons and tabs. No sharp corners, no black borders.
- Color is earned: the peach ground and warm-white surfaces are neutral, and color appears only as gum stickers that each carry one meaning.
- Copy is personal and specific (address terms, "doses," plain-language hints for newcomers), never generic SaaS copy.
- Motion is purposeful and split by owner: GSAP owns scroll-driven motion and the Dosey mascot, framer-motion owns micro-interactions (bouncy press, hover, presence). Every animation needs a `prefers-reduced-motion` path, and content must be visible without motion.

## Accessibility & Inclusion

WCAG AA baseline, matching what's already implemented across the app: `ink` text is 9.8:1 on the peach ground and 12.3:1 on surfaces; `ink-soft` (secondary text) is used on surfaces only; `line-strong` control borders are 3.6:1; every gum sticker is also labelled with text, so color is never the only signal. A 3px `ink` focus ring (`:focus-visible`, defined in `globals.css`), full keyboard operability, `aria-label`/`aria-pressed` on icon-only and toggle controls, and a `prefers-reduced-motion` fallback for every animation.

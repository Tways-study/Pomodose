---
name: Pomodose
description: A measured-dose focus timer, goal tracker, and AI study companion for a pharmacist.
colors:
  paper: "#F6F2EC"
  paper-2: "#EFE9DF"
  ink: "#2E2433"
  ink-soft: "#6B5E6F"
  lilac: "#C9B6E4"
  lilac-deep: "#8465B0"
  amber: "#D9B36B"
  amber-deep: "#B98A3E"
  sage: "#A8B89A"
  clay: "#E0B4A8"
  clay-deep: "#A96552"
  line: "#DED5C8"
  line-strong: "#948066"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(1.5rem, 3vw, 1.875rem)"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  timer:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "normal"
  body:
    fontFamily: "Spline Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Spline Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.18em"
rounded:
  pill: "9999px"
  md: "12px"
  card: "18px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "10px 24px"
  button-primary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
  button-accent:
    backgroundColor: "{colors.lilac}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  button-accent-hover:
    backgroundColor: "{colors.lilac-deep}"
    textColor: "{colors.paper}"
  input-field:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
  card-surface:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "24px"
---

# Design System: Pomodose

## 1. Overview

**Creative North Star: "The Apothecary's Counter"**

Pomodose is built as a personal gift — a Pomodoro timer, daily goal list, and AI companion themed around a pharmacist's daily dosing ritual. The system reads like a well-kept apothecary counter: warm paper, glass and lilac tincture, careful measurement marks, a steady hand. Every session is called a "dose"; the signature timer is drawn as a filling/draining glass vial, never a generic circular progress ring. Copy speaks directly and gently to "Doc" rather than at "the user."

This system explicitly rejects the generic SaaS login/dashboard template — no cold corporate auth forms, no centered-card-on-gradient boilerplate, no gamified streak badges or confetti, nothing clinical or hospital-sterile. It is one calm page, not a multi-panel dashboard, and any new surface (including an access gate) should feel like it was drawn by the same hand as the vial timer and the goal list, not bolted on from a component library.

**Key Characteristics:**
- Warm, editorial, apothecary-calm — gentle precision over corporate efficiency.
- One consistent voice: short, sincere, addressed to "Doc."
- A restrained, muted palette; no saturated "productivity app" colors.
- Fraunces serif for moments of personality (headings, the timer readout, italic asides); Spline Sans for everything functional.
- Soft, low-contrast elevation — shadows are a whisper, not a drop shadow.

## 2. Colors

A warm, low-saturation palette — paper and ink, lilac tincture, sage for completion, clay as the one warm warning note. Nothing here is fully saturated; every color reads as "measured."

### Primary
- **Lilac** (#C9B6E4): the tincture accent — vial liquid, phase-active states, primary interactive accents (add-goal button, chat trigger). Used deliberately, not everywhere.
- **Lilac Deep** (#8465B0): hover/active state for lilac elements, the focus-ring color app-wide, and the vial's meniscus line. Darkened from #9B7FC4 so the focus ring clears WCAG 1.4.11's 3:1 on both surfaces (3.02:1 -> 4.21:1 on paper, 2.79:1 -> 3.89:1 on paper-2).

### Neutral
- **Paper** (#F6F2EC): the base background. Warm off-white, never stark white.
- **Paper Deep** (#EFE9DF): secondary surface — inactive tab pills, input fields, goal-item rows, suggestion chips. One step warmer/darker than Paper.
- **Ink** (#2E2433): primary text and the one dark UI surface (the primary "Begin dose" button background).
- **Ink Soft** (#6B5E6F): secondary/muted text — labels, timestamps, placeholder copy, inactive tab text.
- **Line** (#DED5C8): borders and dividers on the `paper` surface — cards, panels, dividers, tab tracks.
- **Line Strong** (#948066): the same border rule on the `paper-2` surface. `line` measures only 1.20:1 there, below WCAG 1.4.11's 3:1 for a UI component boundary, which left text inputs reading as unbordered blocks. Applies to interactive controls filled with paper-2 (text inputs, suggestion chips) — not to static paper-2 containers like goal rows or the tab track, which keep `line`.

### Secondary
- **Sage** (#A8B89A): completion state only — a checked goal's checkmark button and strikethrough decoration. Never used decoratively elsewhere.
- **Clay** (#E0B4A8): the one warm/warning note — delete-button hover, and the fill of inline error banners at `bg-clay/60`. Reserved for "something needs attention," never a primary color.
- **Clay Deep** (#A96552): the border on error banners and the border of a field that failed validation. `clay/25` on paper measured 1.038:1 against the paper-2 input fill — an error banner was visually indistinguishable from a text field. The border, not the fill, is what makes an error read as an error.
- **Amber** (#D9B36B) / **Amber Deep** (#B98A3E): the second tincture, reserved exclusively for running-state phase chrome (page wash, header sweep, dashboard-card glow, active-tab dot, dose-ring) during short/long breaks — focus sessions stay lilac. Never decorative, never used on the vial itself. Introduced in `plans/003-whole-ui-running-state.md` as a scoped exception to the Rare Accent Rule below.

### Named Rules
**The One Border Rule.** Every border in the app is 1px and comes from the line ramp — `border-line` (#DED5C8) on the `paper` surface, `border-line-strong` (#948066) on the `paper-2` surface. Two values, one rule: the border is always the same *step down* from whatever it sits on. The single-value version of this rule (`border-line` everywhere) is what made inputs invisible, since #DED5C8 on #EFE9DF is 1.20:1. No third border color.

**The Rare Accent Rule.** Lilac is the only saturated-ish color in the palette and appears on a minority of any given screen — the vial liquid, one or two buttons, active states. If lilac starts covering more than a small fraction of a view, pull back.

## 3. Typography

**Display Font:** Fraunces (with Georgia, serif fallback)
**Body Font:** Spline Sans (with system-ui, sans-serif fallback)

**Character:** Fraunces is a variable serif with real personality — used for the app title, the timer's numeric readout, panel headers ("Dosey"), and italicized voice moments (quotes, footer line). Spline Sans stays clean and quiet everywhere functional (body copy, buttons, labels, inputs) so Fraunces reads as a deliberate accent rather than the whole voice. Never Inter, Roboto, or a system sans as the primary typeface — that would flatten the personality this system depends on.

### Hierarchy
- **Display** (font-medium 500, `clamp(1.5rem, 3vw, 1.875rem)` / text-2xl–3xl, tight tracking `-0.01em`): the app title ("Pomodose") and panel headers. Fraunces.
- **Timer** (font-semibold 600, 2.25rem / text-4xl, tabular-nums): the vial's centered time readout — the single largest, most prominent text in the app. Fraunces, `.timer-display` tabular figures so digits don't jitter.
- **Body** (regular 400, 0.875rem / text-sm, 1.5 line-height): goal text, chat messages, buttons, general copy. Spline Sans. Cap prose at a comfortable line length inside the 360px chat panel and the goal cards.
- **Label** (medium 500, 0.75rem / text-xs, 0.18em tracking, uppercase): phase labels under the timer, section eyebrows ("Goals", "Progress"), the "Rx — Take as needed" quote-card tag. Spline Sans, always uppercase with wide tracking — the one place tracked-uppercase is used, and used consistently.

### Named Rules
**The Fraunces-for-Feeling Rule.** Fraunces appears only where the app is being personal or precise (the timer number, headings, italic asides) — never in dense functional UI like button labels or input placeholders. Spline Sans carries function; Fraunces carries feeling.

## 4. Elevation

Pomodose is nearly flat — surfaces are distinguished mainly by the paper/paper-2 tone shift and the single `border-line` rule, not by drop shadows. Where shadows do appear, they're soft, warm-tinted (`rgba(46,36,51,...)`, ink at low opacity, never pure black), and paired with a 1px white inset highlight that reads as a gentle top-edge sheen rather than a lifted card.

### Shadow Vocabulary
- **card** (`0 1px 0 white inset, 0 8px 26px -18px rgba(46,36,51,.10)`): the resting elevation for the goals card and the regimen-progress card — barely-there depth, mostly the white inset sheen.
- **panel** (`0 1px 0 white inset, 0 18px 50px -24px rgba(46,36,51,.35)`): the open Dosey chat panel — the app's one genuinely "lifted" surface, since it floats over the page.
- **floating-action** (`0 8px 26px -12px rgba(46,36,51,.45)`): the fixed "Ask Dosey" trigger button — the strongest shadow in the system, justified because it's a floating, fixed-position control that must read as clickable above everything else.

### Named Rules
**The Whisper Shadow Rule.** Every shadow in this system uses `rgba(46,36,51,...)` (the ink color) at low opacity, never black, and is paired with a `0 1px 0 white inset` highlight. A shadow that reads as heavy or neutral-gray is off-system.

`plans/003-whole-ui-running-state.md` introduces one sanctioned second shadow-tint: a phase-colored glow (lilac or amber, see Colors → Amber) layered under the whisper shadow on the two dashboard cards, strictly gated to `status === "running"` and toggled via a CSS transition, never a continuous loop. This is the only place a non-ink shadow color appears in the system — treat any other use as off-system.

## 5. Components

### Buttons
- **Shape:** fully rounded pill (`rounded-full`, 9999px) for all standalone action buttons; `rounded-md`/`rounded-xl` (12px) only for compact icon-adjacent buttons like the add-goal "+".
- **Primary** (`button-primary`): ink background (#2E2433), paper text, pill shape, `px-6 py-2.5`. Used for the single most important action per view — "Begin dose" / "Pause" / "Resume". Hover: `opacity: 0.9`, no color shift.
- **Ghost** (`button-ghost`): transparent background, `border-line`, `text-ink-soft`. Used for secondary actions like "Reset". Hover: text and border shift to `ink` / `ink-soft`.
- **Accent** (`button-accent`): lilac background, ink text, used for the goal add button and the chat send button. Hover: `lilac-deep` background with paper text — the accent deepens rather than fading.

### Chips / Tabs
- **Style:** `PhaseTabs` is a `paper-2` pill container (`rounded-full`, `border-line`, `p-1`) holding individual pill buttons.
- **State:** active tab is `bg-paper` with `text-ink` and a faint `shadow-sm`; inactive tabs are transparent with `text-ink-soft`, hovering to `text-ink`. Selection reads as "lifted out of the track," not a color change.

### Cards / Containers
- **Corner Style:** 18px (`rounded-card`) for the two dashboard cards (goals, regimen progress); 12px (`rounded-xl`) for the chat panel's transcript bubbles and goal-item rows.
- **Background:** `paper` for top-level cards sitting on the page; `paper-2` for content rows nested inside a card (goal items, suggestion chips, input fields) — the two-tone system is how nesting reads without adding borders-on-borders.
- **Shadow Strategy:** see Elevation → `card` token.
- **Border:** 1px `border-line` on every card and nested row.
- **Internal Padding:** `p-6` (24px) for top-level cards; `px-3.5 py-3` for goal-item rows.

### Inputs / Fields
- **Style:** `paper-2` background, `border-line` 1px border, `rounded-xl` (12px), `text-sm` Spline Sans, `placeholder:text-ink-soft`.
- **Focus:** border shifts to `lilac-deep`, plus a soft `ring-2 ring-lilac/30` glow — no harsh outline, the lilac ring is the only focus treatment besides the app-wide `:focus-visible` outline.
- **Disabled:** `opacity-60`, no other visual change.

### Navigation
There is no traditional nav — Pomodose is a single page. The closest equivalent is `PhaseTabs` (documented above under Chips/Tabs) and the fixed-position "Ask Dosey" trigger button (bottom-right, pill-shaped, lilac background, floats with a slow vertical bob animation).

### Signature Component: The Vial Timer
A hand-drawn SVG vial (glass body + neck + cap), never a circular progress ring. Liquid is a clipped `<rect>` animated between fixed `VIAL_TOP`/`VIAL_BOTTOM` coordinates via Framer Motion (tween, 0.8s, `[0.22, 1, 0.36, 1]` ease), with a meniscus ellipse at the liquid surface and three measurement tick marks at ¼/½/¾ height. During focus sessions the liquid drains; during breaks it inverts to "top up." The time readout sits centered over the glass in Fraunces tabular numerals. This is the single most distinctive element in the app — never replace it with a generic ring, bar, or numeric-only countdown.

## 6. Do's and Don'ts

### Do:
- **Do** use `border-line` (#DED5C8) as the only border color, everywhere, at 1px.
- **Do** keep Fraunces for feeling (headings, the timer, italic voice moments) and Spline Sans for function (buttons, inputs, body copy).
- **Do** use the `rgba(46,36,51,...)` ink-tinted whisper shadow + white inset highlight for any new elevated surface.
- **Do** speak to the user as "Doc" in short, warm, specific lines — never generic SaaS copy ("Welcome back!", "Sign in to continue").
- **Do** keep any new surface (including a login/access gate) on this one calm page's visual register: paper background, a single centered card at most, pill or 12–18px-radius shapes, lilac as the one accent.

### Don't:
- **Don't** use a circular SVG ring, bar, or generic progress component for anything timer-related — the vial is the signature mark.
- **Don't** use Inter, Roboto, Arial, or any system-default sans as a primary typeface.
- **Don't** build a generic SaaS login screen: no centered-white-card-on-gradient template, no "Sign in to your account" boilerplate copy, no cold corporate sans-serif auth form.
- **Don't** add gamified productivity chrome — streak counters, badges, confetti, achievement toasts. This app tracks doses and goals plainly, without game mechanics.
- **Don't** introduce a second border color or a neutral/black shadow color. Amber (running-state phase chrome only, see Colors → Amber) and the one phase-tinted card-glow shadow (see Elevation → Named Rules) are sanctioned exceptions from `plans/003-whole-ui-running-state.md` — don't add further accents or shadow tints beyond those without a new plan entry.
- **Don't** build a sidebar-nav-plus-stat-cards dashboard layout. Pomodose is one page; new surfaces should extend it, not fork into a different information architecture.

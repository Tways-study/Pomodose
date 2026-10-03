---
name: Pomodose
description: A pharmacy made of gumdrops and gelcaps. A measured-dose focus timer, goal tracker, and AI study companion in soft pastel stickers.
colors:
  ground: "#F8DFCF"
  surface: "#FFFCF8"
  surface-2: "#FBEFE6"
  ink: "#3A2F45"
  ink-soft: "#6E6178"
  line-soft: "#E8D3C4"
  line-strong: "#8A7A86"
  gum-sky: "#A8D4FF"
  gum-mint: "#B4E5C4"
  gum-apricot: "#FFB88A"
  gum-butter: "#FFE28A"
  gum-rose: "#FFB3C7"
  gum-lilac: "#CDBBFF"
  alert: "#B42318"
  dosey-lilac: "#B9A4F5"
  dosey-cream: "#FFF1DC"
  dosey-sprout: "#7CC38A"
  dosey-tomato: "#FF7A6B"
  dosey-blush: "#FF9FB2"
typography:
  display:
    fontFamily: "Fredoka, ui-rounded, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "normal"
  title:
    fontFamily: "Fredoka, ui-rounded, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.55
    letterSpacing: "normal"
  timer:
    fontFamily: "Fredoka, ui-rounded, system-ui, sans-serif"
    fontSize: "clamp(3.75rem, 8vw, 4.5rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "normal"
    fontFeature: "tnum"
  body:
    fontFamily: "Nunito, ui-rounded, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  body-small:
    fontFamily: "Nunito, ui-rounded, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: "normal"
  label:
    fontFamily: "Fredoka, ui-rounded, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.43
    letterSpacing: "normal"
rounded:
  control: "18px"
  bubble: "28px"
  pill: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  card-x: "20px"
  card-x-wide: "24px"
  grid-gap: "40px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    typography: "{typography.label}"
    padding: "12px 24px"
    height: "48px"
  button-secondary:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    typography: "{typography.label}"
    padding: "12px 20px"
    height: "48px"
  button-secondary-hover:
    backgroundColor: "{colors.gum-lilac}"
    textColor: "{colors.ink}"
  sticker-focus:
    backgroundColor: "{colors.gum-sky}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  sticker-short-break:
    backgroundColor: "{colors.gum-mint}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  sticker-long-break:
    backgroundColor: "{colors.gum-apricot}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.bubble}"
    padding: "24px"
  input:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
  digit-cell:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
  chat-bubble-user:
    backgroundColor: "{colors.gum-lilac}"
    textColor: "{colors.ink}"
    rounded: "{rounded.bubble}"
    padding: "10px 16px"
  chat-bubble-dosey:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.bubble}"
    padding: "10px 16px"
---

# Design System: Pomodose

## Overview

**Creative North Star: "The Gelcap Pastel"**

A pharmacy made of gumdrops and gelcaps. The page is a soft peach ground; content sits on cream cards with generous bubble corners; every piece of meaning is a pastel sticker that has been pressed onto the surface. Everything is rounded, friendly, and a little squishy, so the app feels like a gift and not like a dashboard. Text is always plum-black `ink` on every pastel, so the sweetness never costs legibility.

Pharmacy survives as vocabulary, not as styling. "Rx #0003", "SIG:", "Qty 4 doses · refills 2", "Dose", "Refill", "Antidote", "Dosing instructions" are copy. The surfaces that carry them are soft, filled, and round, never hard-edged label stock.

Density is calm: one sticky timer card beside a stack of tinted-header cards, big touch targets (44px minimum, 48px for primary actions), and a mascot, Dosey, who peeks, emerges, and answers questions.

**Key Characteristics:**
- Peach ground, cream surfaces, plum-black ink; six pastel "gum" stickers each carrying one meaning.
- Two rounded faces: Fredoka for display, labels, and digits; Nunito for reading text.
- Soft filled pills for text buttons; a 2px outline only where WCAG 1.4.11 needs a visible boundary (text inputs, the unchecked goal checkbox).
- Shallow, warm, layered shadows with a white top-edge highlight; no hard offset shadows.
- Motion split by tool: GSAP for scroll and the mascot, Framer Motion for micro-interactions; every path has a reduced-motion fallback.

## Colors

A peach-and-cream ground with a pastel confectionery accent set where each hue means exactly one thing.

### Primary
- **Plum-Black Ink** (`{colors.ink}`): all text, the primary button fill, the focus ring, the done checkmark, the slider thumb. It is the only dark color; 9.8:1 on ground, 12.3:1 on surface.

### Secondary (the gum stickers; text on every one is `ink`)
- **Sky Gum** (`{colors.gum-sky}`): Dose / focus. Focus phase sticker and active tab, completed focus segments in the cycle strip, the "Dose cycle" card header.
- **Mint Gum** (`{colors.gum-mint}`): Refill / short break, and done. Short-break sticker and segments, the checked goal circle, the "Today's goals" header, calm completion notes.
- **Apricot Gum** (`{colors.gum-apricot}`): Antidote / long break, and warnings. Long-break sticker and segment, burnout notes.
- **Butter Gum** (`{colors.gum-butter}`): nudges. The "Doses today" pill, the vessel cap, nudge notes, the "Study note" header.
- **Rose Gum** (`{colors.gum-rose}`): remove and undo. Remove-goal hover fill, the hand-drawn strike through a finished goal.
- **Lilac Gum** (`{colors.gum-lilac}`): Dosey and chat. Dosey trigger, user chat bubbles, selected vessel toggle, the chime slider fill, hover tint on secondary pills, text selection, the glass tint of the vessel.

### Tertiary
- **Alert Red** (`{colors.alert}`): error text and error borders only (6.4:1 on surface). Never a decorative color.

### Neutral
- **Peach Ground** (`{colors.ground}`): the page, the browser theme color, the manifest background.
- **Cream Surface** (`{colors.surface}`): cards, modal, chat panel, the header's profile bubble and gear button, and the settings and account panels.
- **Shell Cream** (`{colors.surface-2}`): inset wells: tab track, goal rows, input fills, digit cells, secondary buttons, Dosey's reply bubble.
- **Ink Soft** (`{colors.ink-soft}`): secondary text; 5.6:1 on surface, only 4.5:1 on ground, so use it on surfaces and never on the bare ground.
- **Soft Line** (`{colors.line-soft}`): decorative hairlines and the dotted divider; never a control boundary.
- **Strong Line** (`{colors.line-strong}`): the interactive boundary (3.6:1): text-input outline, unchecked checkbox outline, scrollbar thumb.

### Dosey palette (the mascot only)
Dosey Lilac (`{colors.dosey-lilac}`) body and the vessel liquid, Dosey Cream (`{colors.dosey-cream}`) belly, Dosey Sprout (`{colors.dosey-sprout}`) leaves, Dosey Tomato (`{colors.dosey-tomato}`) fruit, Dosey Blush (`{colors.dosey-blush}`) cheeks. These are the mascot's three semantic colors plus a cheek accent; they are not general UI colors, except that the timer liquid reuses Dosey Lilac.

### Named Rules
**The One Meaning Rule.** Each gum color means one thing (sky = dose, mint = refill or done, apricot = antidote or warning, butter = nudge, rose = remove, lilac = Dosey). Do not use a gum color decoratively or for a second meaning.

**The Ink-On-Pastel Rule.** Text on any gum or surface fill is `ink`. Never white text on a pastel, never `ink-soft` on the bare ground.

**The Boundary Rule.** A control that needs a visible edge for non-text contrast gets a 2px `line-strong` outline. Soft pills with a text label and a distinct fill need none.

## Typography

**Display Font:** Fredoka (with ui-rounded, system-ui, sans-serif), variable weight, loaded via next/font as `--font-display`.
**Body Font:** Nunito (with ui-rounded, system-ui, sans-serif), variable weight, as `--font-body`.

**Character:** Two rounded faces that read as one family: Fredoka is chunky and candy-label, Nunito is gentle and readable at length. Fredoka carries anything that is a name, a button, or a number; Nunito carries anything that is a sentence.

### Hierarchy
- **Display** (Fredoka 600, 1.875rem, 1.2): the "Pomodose" wordmark heading on the app and login (login is the same size).
- **Title** (Fredoka 600, 1.125rem / 1.25rem for the Rx label's "Pomodose Pharmacy", 1.5rem for form and help headings): card header titles, dialog titles.
- **Timer** (Fredoka 600, 3.75rem, 4.5rem from the `sm` breakpoint, tabular numerals): the countdown, each character in its own fixed-width cell. A 1.5rem variant sits in the sticky bar.
- **Body** (Nunito 400, 1rem): goal text, chat input, the Dosey speech bubble.
- **Body Small** (Nunito 400, 0.875rem; `ink-soft` on surfaces): SIG line, qty and refills line, helper copy, errors. 0.75rem is used only for the tab hint.
- **Label** (Fredoka 500, 0.875rem to 1rem): buttons, pills, tabs, stickers. The Doses-today count is Fredoka 600 at 1.5rem.

### Named Rules
**The Tabular Rule.** Every changing number uses tabular figures (`.digits`) inside fixed-width cells, so the countdown never jitters.

**The Two Faces Rule.** Only Fredoka and Nunito. No third family and no system display face in components.

## Layout

A single main page, max width 1240px, side padding 16px (32px from `sm`), top padding 32px (48px from `sm`). On large screens (`lg`) a two-column grid, 5fr / 7fr with a 40px gap: the left column is the sticky Rx label (timer card) at `top-6`; the right column is a stack of cards with 24px vertical rhythm, offset 90px down so the left card's mascot peek has headroom. Below `lg` it is a single column with 24px gap, and a sticky timer bar pins to the top (mobile only) once the Rx label has scrolled out of view. Card padding is 20px (24px from `sm`); header bands 14px vertical.

Controls hold a 44px minimum hit area (goal check and remove, profile bubble, gear, sign out, help, chat close) and 48px for primary actions, tabs, and the rows inside the settings panel. The footer is a hairline-topped row of the quote line and the version; every preference lives in the gear menu.

Layers via named z-index tokens: `base` 0, `content` 10, `sticky` 20 (phase sticker, sticky bar), `overlay` 30, `modal` 50 (chat FAB, chat panel, help modal).

The login page is one centered column, max width 24rem on the ground: Dosey and the wordmark above a single surface card.

## Elevation & Depth

Hybrid: tonal layering first (ground, then cream surface, then shell-cream wells), with shallow warm shadows that all carry a 1px white inner top highlight, so surfaces read like soft gel, not like floating paper. Shadows are tinted warm brown or plum, never neutral black.

### Shadow Vocabulary
- **Soft** (`box-shadow: 0 1px 0 rgba(255,255,255,.9) inset, 0 10px 24px -12px rgba(150,90,60,.30)`; class `shadow-soft`): cards, chat panel, help modal, sticky bar, the profile bubble, the gear button, and the settings and account panels.
- **Gum** (`0 1px 0 rgba(255,255,255,.7) inset, 0 3px 8px -3px rgba(150,90,60,.35)`; `shadow-gum`): stickers, icon bubbles, secondary pills, tab thumb, notes.
- **Pop** (`0 1px 0 rgba(255,255,255,.55) inset, 0 6px 14px -6px rgba(58,47,69,.45)`; `shadow-pop`): the ink primary buttons and the Dosey trigger only.

### Named Rules
**The Gel Highlight Rule.** Every shadow includes the white inset top edge. Do not write a shadow string inline; use `shadow-soft`, `shadow-gum`, or `shadow-pop`.

**The Soft-Only Rule.** Shadows are diffuse and offset downward by a few pixels with negative spread. No hard offset or zero-blur shadows.

## Shapes

A three-step radius scale: `control` 18px (inputs, goal rows, digit cells, the Dosey bubble, inner stages), `bubble` 28px (every card, dialog, notes, chat bubbles), `pill` 9999px (all buttons, tabs, stickers, icon bubbles, checkboxes, cycle segments). Chat bubbles use `bubble` with one corner dropped to `control` at the speaker's tail corner. Header bands round the card's top corners to match.

Hairline 1px `line-soft` borders outline cards; the dotted 3px `line-soft` divider separates label sections. Break segments in the cycle strip are filled solidly.

Dosey follows mascot rules: flat outline-free shapes, about five large rounded shapes, three semantic colors, a big head with tiny wide-set eyes, blunt tips, upright posture. Below 40px the rig automatically switches to the `face` variant.

## Components

### Buttons
- **Shape:** pill (9999px), minimum 48px high (44px in the sticky bar, vessel toggle, and sign-out).
- **Primary:** ink fill, surface-colored Fredoka 500 label, `shadow-pop`, 12px by 24px padding, optional 18px stroke-2.25 lucide icon; hover lifts 2px only on fine-pointer hover devices.
- **Secondary:** `surface-2` fill, ink label, `shadow-gum`; hover washes to `gum-lilac` at 40%.
- **Pressed:** Framer `whileTap` scale 0.88 to 0.96 with `SPRING_BOUNCY`; removed under reduced motion.
- **Text-labelled buttons carry no outline;** icon-only buttons are 44px transparent circles that fill on hover (surface-2, or gum-rose for remove).

### Stickers and Chips
- **Style:** pill, `ink` text, Fredoka 500 at 0.875rem, `shadow-gum`, background from the gum role. The phase sticker (`PHASE_STICKER_CLASS`) is the same fill used by the active tab thumb and the sticky bar badge. On the Rx label it sits rotated 3 degrees at the card corner.
- **Neutral chips:** the Rx number and the date are `surface-2` pills in `ink-soft`.

### Cards / Containers (LabelCard)
- **Corner Style:** `bubble` 28px, 1px `line-soft` border, `surface` fill, `shadow-soft`.
- **Header band:** a role-tinted row (the gum color at 25%) with a 36px pill icon bubble (the full gum color, `shadow-gum`, ink 18px icon) and a Fredoka 600 title. Roles: goals mint, dose cycle sky, study note butter, Meet Dosey lilac.
- **Body padding:** 20px (24px from `sm`).

### Inputs / Fields
- **Style:** `surface-2` fill, 2px `line-strong` outline, `control` radius, 12px by 16px padding, Nunito 1rem, ink caret and text, `ink-soft` placeholder.
- **Focus:** border turns `ink` and a 4px `gum-lilac` 60% ring appears.
- **Error:** border and text turn `alert`; inline message in `alert` plus an `alert`-bordered note with icon for form-level errors. Disabled drops to 60% opacity.

### Navigation (Phase Tabs)
A pill track (`surface-2`, 6px padding) with three 48px pill options: Dose / Refill / Antidote, each with a Nunito hint (Focus, Short break, Long break). The active option has a shared gum thumb (`layoutId`, `SPRING_UI`) in the phase's color; inactive text is `ink-soft`.

### Vial Timer (signature)
A gummy glass vessel, switchable between a flask and a graduated cylinder, in a 180 by 230 SVG, 200px wide. The glass is a 25% `gum-lilac` tint; the liquid is Dosey Lilac scaled from the bottom with a 1-second linear tween (focus drains, breaks refill); a faint meniscus, static flat bubbles, and a gloss stripe sit inside the clip. The cap is butter. The cylinder adds ink-soft graduations and "mL". The countdown above it is one soft `surface-2` cell per digit. The liquid color is fixed and is not driven by the phase color. Not a progress ring.

### Goal Row
A `surface-2` row, 56px minimum height. The unchecked checkbox is a 28px circle with a 2px `line-strong` outline (WCAG 1.4.11); checked it fills mint with a hand-drawn ink check that draws itself, and a wavy rose strike draws across the text. Remove is a 44px circle that fills rose on hover.

### Dose Cycle Strip
A 36px row of pill segments sized by true duration (focus 25, short 5, long 15 in the build's settings): done focus segments sky, upcoming focus segments `surface-2`, short breaks mint, the long break apricot, and a 4px `ink/15` ring on the active segment.

### Notes (Counter Note, Quote Card)
Counter notes are full-width `bubble` strips in apricot (burnout), butter (nudges), or mint (celebration), `shadow-gum`, with a dismiss circle. The Study note quote is Fredoka 1.25rem on the card body.

### Dosey Chat
A lilac pill trigger (`shadow-pop`) bottom-right; a 360px panel on desktop and a bottom sheet on phones (80dvh), `bubble` top corners, `line-soft` header and composer dividers. User bubbles lilac, Dosey bubbles `surface-2`. Suggestions are secondary pills. Composer input follows the standard input rule; send is a 44px ink circle.

### Dosey Mascot
One rig with three variants: `full` (Meet Dosey, login), `peek` (head over the Rx label's top edge, 120 by 96 slot), `face` (under 40px, chat trigger). Meet Dosey crops the body into the stage's lower-left corner and scrubs the body, sprout, leaves, and tomatoes in on scroll; eyes follow the pointer; poking cycles speech lines in a bubble with a small tail.

### Help Modal and Form Controls
The help modal is a `bubble` card over an `ink/40` scrim with a list of 40px colored icon bubbles per tip. The chime slider is a 6px pill track filled lilac with a round ink thumb ringed in surface; the chime and notification rows sit inside the gear menu as flat `surface-2` pills. The header holds a profile bubble (a lilac initial avatar plus the signed-in email, truncated) and a gear button; each opens a small `bubble` panel (`HeaderPopover`) that closes on Escape or an outside press, and the panel is nudged back inside the viewport on phones. The gear panel holds Chime, Notify and Help and tips; the profile panel shows the full email and Sign out.

### Motion
GSAP (`lib/gsap.ts`) owns scroll reveals (12px rise, 0.4s, 0.06s stagger, `power3.out`, one-shot at top 88%) and the mascot timeline; hidden start states exist only inside `withMotion`, so reduced-motion and no-JS users see everything. Framer owns micro-interactions: `SPRING_UI` (stiffness 400, damping 30), `SPRING_SOFT` (260, 26) for panels, `SPRING_BOUNCY` (520, 18) for presses, and `EASE_OUT` cubic-bezier(0.22, 1, 0.36, 1) for entrances. A global reduced-motion media rule collapses CSS animations and transitions. Never animate one element with both libraries.

## Do's and Don'ts

### Do:
- **Do** put `ink` text on every pastel and every surface; use `ink-soft` only on `surface` or `surface-2`.
- **Do** give each gum color its single meaning (sky dose, mint refill or done, apricot antidote or warning, butter nudge, rose remove, lilac Dosey).
- **Do** keep text-labelled buttons as soft filled pills with no outline, and give text inputs and the unchecked checkbox a 2px `line-strong` outline.
- **Do** use 44px minimum hit areas, 48px for primary actions, and a 3px ink focus ring with 3px offset on every focusable element.
- **Do** write pharmacy vocabulary as copy ("Rx #", "SIG", "Qty", "refills", "Antidote") on soft rounded surfaces.
- **Do** use `shadow-soft`, `shadow-gum`, `shadow-pop`, the three radii, and the named z-index tokens instead of inline values.
- **Do** keep Dosey flat and outline-free with about five large rounded shapes, three semantic colors, a big head, tiny wide-set eyes, and blunt tips; use the `face` variant under 40px.
- **Do** give every animation a reduced-motion path and keep hidden start states inside `withMotion`.

### Don't:
- **Don't** put a hard, zero-blur, or offset shadow on anything; shadows stay soft and warm.
- **Don't** use a third typeface, a system display face, or a hard-edged ruled "label stock" look; Rx wording is copy only.
- **Don't** drive the vessel liquid from the phase color; it stays Dosey Lilac.
- **Don't** replace the vial with a circular progress ring.
- **Don't** use white text on pastels or `ink-soft` on the bare peach ground.
- **Don't** use `line-soft` as a control boundary; it is decorative only.
- **Don't** reveal content from a hidden state outside `withMotion`, or let GSAP and Framer animate the same element.

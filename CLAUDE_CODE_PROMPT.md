# Build: "Apothecary" — Pharmacist's Study Companion

You are building a Pomodoro focus timer + goal tracker + motivational quote app called **Apothecary**. It is a gift for a pharmacist. Build it production-grade from scratch. Follow this spec exactly and do not ask unless a decision is genuinely ambiguous.

---

## 1. Scaffold

```bash
npx create-next-app@latest apothecary \
  --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
cd apothecary
npm install framer-motion zod
```

After scaffolding, delete all boilerplate content from `app/page.tsx`, `app/globals.css`, and `app/layout.tsx`. Start clean.

---

## 2. Design Tokens — Tailwind Theme

In `tailwind.config.ts`, extend the theme with these exact values. **Never hardcode hex values in components** — always use these token names.

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper:      "#F6F2EC",
        "paper-2":  "#EFE9DF",
        ink:        "#2E2433",
        "ink-soft": "#6B5E6F",
        lilac:      "#C9B6E4",
        "lilac-deep":"#9B7FC4",
        sage:       "#A8B89A",
        clay:       "#E0B4A8",
        line:       "#DED5C8",
      },
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        sans:  ["Spline Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "18px",
      },
    },
  },
  plugins: [],
};
export default config;
```

---

## 3. Fonts — `app/layout.tsx`

Use `next/font/google`. Load **Fraunces** (variable axes: opsz, weights 400/500/600, include italic) and **Spline Sans** (weights 400/500/600). Apply both to `<html>` via CSS variables. No Inter anywhere.

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import { Fraunces, Spline_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const splineSans = Spline_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Apothecary — Study Companion",
  description: "A measured-dose focus timer for the pharmacist in your life.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${splineSans.variable}`}>
      <body className="font-sans bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
```

---

## 4. Global CSS — `app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html { font-family: var(--font-sans), system-ui, sans-serif; }
  body {
    background:
      radial-gradient(120% 80% at 80% -10%, #F0E7F7 0%, transparent 45%),
      theme('colors.paper');
  }
  /* Tabular figures on timer display only */
  .timer-display { font-variant-numeric: tabular-nums; }
  /* Visible focus ring */
  :focus-visible { outline: 2px solid theme('colors.lilac-deep'); outline-offset: 3px; }
}

@layer utilities {
  .font-serif { font-family: var(--font-serif), Georgia, serif; }
  .font-sans  { font-family: var(--font-sans), system-ui, sans-serif; }
}
```

---

## 5. File Structure

Create every file listed. One concern per file — no exceptions.

```
app/
  layout.tsx
  page.tsx
  globals.css
components/
  phase-tabs.tsx
  vial-timer.tsx
  quote-card.tsx
  goal-item.tsx
  goal-list.tsx
  regimen-progress.tsx
lib/
  settings.ts
  timer-machine.ts
  quotes.ts
  storage.ts
types/
  index.ts
```

---

## 6. Types — `types/index.ts`

```ts
export type Phase = "focus" | "short" | "long";
export type TimerStatus = "idle" | "running" | "paused" | "complete";

export interface TimerState {
  phase: Phase;
  status: TimerStatus;
  remaining: number;   // seconds
  total: number;       // seconds (= duration for current phase)
  startedAt: number | null;  // Date.now() snapshot when last started
  focusCycle: number;  // how many focus sessions completed (mod 4 = position toward long break)
  dailyDoses: number;
}

export interface Goal {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

export interface PersistedGoals {
  date: string;    // "YYYY-MM-DD"
  goals: Goal[];
}
```

---

## 7. Settings — `lib/settings.ts`

```ts
export const SETTINGS = {
  FOCUS_DURATION:      25 * 60,   // seconds
  SHORT_BREAK:          5 * 60,
  LONG_BREAK:          15 * 60,
  CYCLE_LENGTH:         4,         // focus sessions before long break
  QUOTE_IDLE_MS:       12_000,
} as const;
```

---

## 8. Timer State Machine — `lib/timer-machine.ts`

Implement a pure reducer. **Drive the countdown from `Date.now()` + `startedAt`, not decrement-per-tick**, so backgrounded tabs stay accurate.

```ts
// lib/timer-machine.ts
import { SETTINGS } from "./settings";
import type { Phase, TimerState } from "@/types";

function durationFor(phase: Phase): number {
  if (phase === "focus") return SETTINGS.FOCUS_DURATION;
  if (phase === "short") return SETTINGS.SHORT_BREAK;
  return SETTINGS.LONG_BREAK;
}

export type TimerAction =
  | { type: "START" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "RESET" }
  | { type: "TICK" }           // dispatched by a 1s interval in the component
  | { type: "COMPLETE" }
  | { type: "SET_PHASE"; phase: Phase };

export const initialTimerState: TimerState = {
  phase: "focus",
  status: "idle",
  remaining: SETTINGS.FOCUS_DURATION,
  total: SETTINGS.FOCUS_DURATION,
  startedAt: null,
  focusCycle: 0,
  dailyDoses: 0,
};

export function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case "SET_PHASE": {
      const total = durationFor(action.phase);
      return { ...state, phase: action.phase, status: "idle", remaining: total, total, startedAt: null };
    }
    case "START":
      if (state.status !== "idle") return state;
      return { ...state, status: "running", startedAt: Date.now() };

    case "PAUSE":
      if (state.status !== "running") return state;
      return { ...state, status: "paused", startedAt: null };

    case "RESUME":
      if (state.status !== "paused") return state;
      return { ...state, status: "running", startedAt: Date.now() };

    case "RESET": {
      const total = durationFor(state.phase);
      return { ...state, status: "idle", remaining: total, total, startedAt: null };
    }

    case "TICK": {
      // Recalculate remaining from the timestamp delta to stay accurate
      if (state.status !== "running" || state.startedAt === null) return state;
      const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
      const remaining = Math.max(0, state.total - elapsed);
      if (remaining === 0) return state; // let COMPLETE handle it
      return { ...state, remaining };
    }

    case "COMPLETE": {
      if (state.phase === "focus") {
        const focusCycle = state.focusCycle + 1;
        const dailyDoses = state.dailyDoses + 1;
        const nextPhase: Phase = focusCycle % SETTINGS.CYCLE_LENGTH === 0 ? "long" : "short";
        const total = durationFor(nextPhase);
        return { ...state, phase: nextPhase, status: "idle", remaining: total, total, startedAt: null, focusCycle, dailyDoses };
      }
      // rest complete → return to focus
      const total = durationFor("focus");
      return { ...state, phase: "focus", status: "idle", remaining: total, total, startedAt: null };
    }

    default:
      return state;
  }
}
```

---

## 9. Quotes — `lib/quotes.ts`

```ts
export type Quote = { text: string; author: string };

export const QUOTES: readonly Quote[] = [
  { text: "Small consistent doses compound into mastery.", author: "— for you, Doc" },
  { text: "You don't have to finish the bottle today — just take the next dose.", author: "— a gentle reminder" },
  { text: "Precision is a habit, not a moment.", author: "— the pharmacist's creed" },
  { text: "Rest is part of the prescription, not a break from it.", author: "— take as directed" },
  { text: "The expert was once a beginner who refused to quit.", author: "— keep going" },
  { text: "Focus is the rarest medicine. You're refilling it right now.", author: "— for you" },
  { text: "Progress hides in the unglamorous hours.", author: "— trust the process" },
  { text: "One dose at a time is how every long course is finished.", author: "— stay the course" },
  { text: "You measure everything carefully. Measure your effort the same way.", author: "— a quiet nudge" },
  { text: "Tired is not the same as done. Rest, then continue.", author: "— take care of yourself" },
  { text: "The work you do when no one's watching is the active ingredient.", author: "— the real formula" },
  { text: "Showing up unremarkably, daily, is the whole secret.", author: "— no shortcuts" },
  { text: "Be patient with the process the way you are precise with the dose.", author: "— for you, Doc" },
  { text: "A calm mind is the best instrument you own. Tend to it.", author: "— a soft reminder" },
  { text: "You've handled harder than this chapter. Begin.", author: "— I believe in you" },
] as const;

/** Fisher-Yates shuffle — ensures all quotes are seen before any repeats. */
export function shuffledOrder(length: number): number[] {
  const order = Array.from({ length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}
```

---

## 10. Storage — `lib/storage.ts`

Zod-guarded, date-keyed, midnight-rolling. **No raw `JSON.parse` without validation.**

```ts
import { z } from "zod";

const GoalSchema = z.object({
  id: z.string(),
  text: z.string(),
  done: z.boolean(),
  createdAt: z.number(),
});

const PersistedGoalsSchema = z.object({
  date: z.string(),
  goals: z.array(GoalSchema),
});

type PersistedGoals = z.infer<typeof PersistedGoalsSchema>;

const STORAGE_KEY = "apothecary_goals";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

export function loadGoals(): PersistedGoals["goals"] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = PersistedGoalsSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return [];
    // Roll: if stored date ≠ today, start fresh
    if (parsed.data.date !== todayKey()) return [];
    return parsed.data.goals;
  } catch {
    return [];
  }
}

export function saveGoals(goals: PersistedGoals["goals"]): void {
  if (typeof window === "undefined") return;
  const payload: PersistedGoals = { date: todayKey(), goals };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}
```

---

## 11. Components

### 11.1 `components/phase-tabs.tsx`

```tsx
"use client";
import type { Phase } from "@/types";

const PHASES: { id: Phase; label: string }[] = [
  { id: "focus", label: "Focus" },
  { id: "short", label: "Short break" },
  { id: "long",  label: "Long break" },
];

interface Props {
  active: Phase;
  onChange: (phase: Phase) => void;
}

export function PhaseTabs({ active, onChange }: Props) {
  return (
    <div
      role="group"
      aria-label="Session type"
      className="inline-flex bg-paper-2 border border-line rounded-full p-1 gap-0.5"
    >
      {PHASES.map(({ id, label }) => (
        <button
          key={id}
          aria-pressed={active === id}
          onClick={() => onChange(id)}
          className={[
            "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
            active === id
              ? "bg-paper text-ink shadow-sm"
              : "text-ink-soft hover:text-ink",
          ].join(" ")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
```

### 11.2 `components/vial-timer.tsx`

This is the signature element. **Do not replace with a circular ring.**

The SVG vial has:
- A glass body path, a neck, a cap
- Tick marks at three heights (¼, ½, ¾)
- A `<clipPath>` that constrains the liquid rect to the inside of the glass
- A liquid `<rect>` whose `y` and `height` are driven by `remaining/total`
- An ellipse "meniscus" at the liquid surface

**Liquid math:**
```
VIAL_TOP    = 44   (y coord where liquid starts, just below neck)
VIAL_BOTTOM = 205  (y coord at the bottom of the glass)
VIAL_RANGE  = VIAL_BOTTOM - VIAL_TOP   // = 161px

height = VIAL_RANGE * (remaining / total)
y      = VIAL_BOTTOM - height
```

During **focus** the vial drains (height shrinks as remaining falls).
During **rests** optionally invert — liquid refills as remaining falls — to signal "topping up."

Use Framer Motion `animate` prop on the `<motion.rect>` for smooth `y`/`height` transitions (`spring` or `tween` with ~800ms duration).

The time readout sits absolutely centered over the vial. Use `font-serif timer-display` Tailwind classes. Phase label beneath it in `text-ink-soft text-xs tracking-widest uppercase`.

Controls below the vial:
- **Primary button:** `"Begin dose"` → `"Pause"` → `"Resume"`. Background `bg-ink text-paper`.
- **Ghost button:** `"Reset"`. Border `border-line`.

Wire to the timer machine via props: `state: TimerState`, `dispatch: Dispatch<TimerAction>`.

The component owns the `setInterval` tick:
```ts
useEffect(() => {
  if (state.status !== "running") return;
  const id = setInterval(() => {
    const elapsed = Math.floor((Date.now() - (state.startedAt ?? Date.now())) / 1000);
    if (elapsed >= state.total) {
      dispatch({ type: "COMPLETE" });
    } else {
      dispatch({ type: "TICK" });
    }
  }, 1000);
  return () => clearInterval(id);
}, [state.status, state.startedAt, state.total, dispatch]);
```

### 11.3 `components/quote-card.tsx`

```tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { QUOTES, shuffledOrder } from "@/lib/quotes";
import { SETTINGS } from "@/lib/settings";

interface Props {
  /** Increment this whenever a session completes to force an immediate advance. */
  advanceSignal?: number;
  /** Pause idle cycling while the timer is running. */
  paused?: boolean;
}

export function QuoteCard({ advanceSignal = 0, paused = false }: Props) {
  const reduceMotion = useReducedMotion();
  const bag    = useRef<number[]>(shuffledOrder(QUOTES.length));
  const cursor = useRef(0);
  const [index, setIndex] = useState(() => bag.current[0]);

  const next = useCallback(() => {
    cursor.current += 1;
    if (cursor.current >= bag.current.length) {
      bag.current = shuffledOrder(QUOTES.length);
      cursor.current = 0;
    }
    setIndex(bag.current[cursor.current]);
  }, []);

  // Idle auto-cycle — paused while timer runs
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(next, SETTINGS.QUOTE_IDLE_MS);
    return () => window.clearInterval(id);
  }, [paused, next]);

  // Advance on session completion
  const prevSignal = useRef(advanceSignal);
  useEffect(() => {
    if (advanceSignal !== prevSignal.current) {
      prevSignal.current = advanceSignal;
      next();
    }
  }, [advanceSignal, next]);

  const quote = useMemo(() => QUOTES[index], [index]);

  // Directional blur-lift: exits up, enters from below
  const variants = reduceMotion
    ? { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        enter:  { opacity: 0, y: 8,  filter: "blur(4px)" },
        center: { opacity: 1, y: 0,  filter: "blur(0px)" },
        exit:   { opacity: 0, y: -8, filter: "blur(4px)" },
      };

  return (
    <figure className="max-w-sm mt-8">
      <span className="font-serif italic text-xs tracking-widest uppercase text-lilac-deep block mb-2.5">
        Rx — Take as needed
      </span>

      {/* min-h prevents layout jump between quote lengths */}
      <div className="min-h-[84px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.blockquote
            key={index}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduceMotion ? 0.2 : 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="font-serif text-lg leading-snug">{quote.text}</p>
            <cite className="block mt-2 not-italic text-sm text-ink-soft">{quote.author}</cite>
          </motion.blockquote>
        </AnimatePresence>
      </div>
    </figure>
  );
}
```

### 11.4 `components/goal-item.tsx`

```tsx
"use client";
import { motion } from "framer-motion";
import type { Goal } from "@/types";

interface Props {
  goal: Goal;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function GoalItem({ goal, onToggle, onDelete }: Props) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-3 px-3.5 py-3 bg-paper-2 border border-line rounded-xl"
    >
      {/* Checkmark button */}
      <button
        aria-label={goal.done ? "Mark incomplete" : "Mark complete"}
        onClick={() => onToggle(goal.id)}
        className={[
          "flex-none w-5 h-5 rounded-md border-2 relative transition-all duration-200",
          goal.done
            ? "bg-sage border-sage"
            : "border-lilac-deep bg-transparent",
        ].join(" ")}
      >
        <motion.svg
          viewBox="0 0 13 13"
          fill="none"
          className="absolute inset-0 m-auto w-3 h-3"
          initial={false}
          animate={{ opacity: goal.done ? 1 : 0, scale: goal.done ? 1 : 0.4 }}
          transition={{ duration: 0.2 }}
        >
          <path d="M2 7l3 3 6-7" stroke="#F6F2EC" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </button>

      {/* Label */}
      <span
        className={[
          "flex-1 text-sm leading-snug transition-colors duration-200",
          goal.done ? "text-ink-soft line-through decoration-sage" : "text-ink",
        ].join(" ")}
      >
        {goal.text}
      </span>

      {/* Delete */}
      <button
        aria-label="Remove goal"
        onClick={() => onDelete(goal.id)}
        className="flex-none text-ink-soft hover:text-clay text-lg leading-none opacity-50 hover:opacity-100 transition-opacity duration-150"
      >
        ×
      </button>
    </motion.li>
  );
}
```

### 11.5 `components/goal-list.tsx`

```tsx
"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { GoalItem } from "./goal-item";
import { loadGoals, saveGoals } from "@/lib/storage";
import type { Goal } from "@/types";

interface Props {
  onProgressChange?: (done: number, total: number) => void;
}

export function GoalList({ onProgressChange }: Props) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    setGoals(loadGoals());
  }, []);

  // Persist + notify parent on every change
  const update = useCallback((next: Goal[]) => {
    setGoals(next);
    saveGoals(next);
    onProgressChange?.(next.filter(g => g.done).length, next.length);
  }, [onProgressChange]);

  function add() {
    const text = input.trim();
    if (!text || text.length > 80) return;
    const goal: Goal = {
      id: crypto.randomUUID(),
      text,
      done: false,
      createdAt: Date.now(),
    };
    update([...goals, goal]);
    setInput("");
    inputRef.current?.focus();
  }

  function toggle(id: string) {
    update(goals.map(g => g.id === id ? { ...g, done: !g.done } : g));
  }

  function remove(id: string) {
    update(goals.filter(g => g.id !== id));
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif font-semibold text-lg tracking-tight">Today's regimen</h2>
        <span className="text-xs tracking-widest uppercase text-ink-soft">Goals</span>
      </div>

      {/* Input row */}
      <div className="flex gap-2 mb-4">
        <input
          ref={inputRef}
          type="text"
          maxLength={80}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()}
          placeholder="e.g. Review pharmacokinetics ch.4"
          className="flex-1 bg-paper-2 border border-line rounded-xl px-3.5 py-2.5 text-sm placeholder:text-ink-soft focus:border-lilac-deep focus:ring-2 focus:ring-lilac/30 outline-none transition-all"
        />
        <button
          onClick={add}
          aria-label="Add goal"
          className="flex-none w-10 rounded-xl bg-lilac text-ink text-xl font-medium hover:bg-lilac-deep hover:text-paper transition-colors duration-200"
        >
          +
        </button>
      </div>

      {/* List */}
      <ul className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {goals.map(g => (
            <GoalItem key={g.id} goal={g} onToggle={toggle} onDelete={remove} />
          ))}
        </AnimatePresence>
      </ul>

      {goals.length === 0 && (
        <p className="text-center text-sm italic text-ink-soft py-4">
          No goals prescribed yet. Add one above.
        </p>
      )}
    </section>
  );
}
```

### 11.6 `components/regimen-progress.tsx`

```tsx
"use client";
import { motion } from "framer-motion";
import { SETTINGS } from "@/lib/settings";

interface Props {
  cyclePosition: number;   // 0–3 (focus sessions completed in current cycle)
  dailyDoses: number;
  goalsDone: number;
  goalsTotal: number;
}

export function RegimenProgress({ cyclePosition, dailyDoses, goalsDone, goalsTotal }: Props) {
  const pct = goalsTotal > 0 ? (goalsDone / goalsTotal) * 100 : 0;

  return (
    <section className="bg-paper border border-line rounded-card p-6 shadow-[0_1px_0_white_inset,0_8px_26px_-18px_rgba(46,36,51,.10)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif font-semibold text-lg tracking-tight">Focus regimen</h2>
        <span className="text-xs tracking-widest uppercase text-ink-soft">Progress</span>
      </div>

      <div className="flex items-baseline justify-between mb-3">
        <div>
          <span className="font-serif text-3xl font-semibold">{goalsDone}</span>
          <span className="text-sm text-ink-soft"> / {goalsTotal} goals done</span>
        </div>
        <div className="text-right">
          <span className="font-serif text-3xl font-semibold">{cyclePosition}</span>
          <span className="text-sm text-ink-soft"> / {SETTINGS.CYCLE_LENGTH} to long break</span>
        </div>
      </div>

      {/* Dose dots */}
      <div className="flex gap-2 flex-wrap mb-3">
        {Array.from({ length: SETTINGS.CYCLE_LENGTH }, (_, i) => (
          <motion.div
            key={i}
            animate={{ scale: i < cyclePosition ? 1.06 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={[
              "w-6 h-6 rounded-full border-[1.5px] border-lilac-deep transition-colors duration-300",
              i < cyclePosition ? "bg-lilac" : "bg-transparent",
            ].join(" ")}
          />
        ))}
        <span className="text-xs text-ink-soft ml-1 self-center">{dailyDoses} total today</span>
      </div>

      {/* Goals progress bar */}
      <div className="h-1.5 rounded-full bg-paper-2 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-lilac to-lilac-deep"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </section>
  );
}
```

---

## 12. Page — `app/page.tsx`

Compose all components. Lift timer state here; pass down only what each child needs.

```tsx
"use client";

import { useReducer, useState } from "react";
import { PhaseTabs }        from "@/components/phase-tabs";
import { VialTimer }         from "@/components/vial-timer";
import { QuoteCard }         from "@/components/quote-card";
import { GoalList }          from "@/components/goal-list";
import { RegimenProgress }   from "@/components/regimen-progress";
import { timerReducer, initialTimerState } from "@/lib/timer-machine";

export default function Home() {
  const [timer, dispatch] = useReducer(timerReducer, initialTimerState);
  const [goalsDone, setGoalsDone]   = useState(0);
  const [goalsTotal, setGoalsTotal] = useState(0);

  const cyclePosition = timer.focusCycle % 4;

  return (
    <div className="max-w-[1180px] mx-auto px-4 sm:px-8 py-8 sm:py-12">

      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5 mb-10">
        <div className="flex items-center gap-3.5">
          {/* Apothecary vial mark */}
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden>
            <rect x="11" y="2" width="12" height="6" rx="2" fill="#C9B6E4" stroke="#2E2433" strokeWidth="2"/>
            <path d="M13 8v5l-5 14a4 4 0 0 0 3.7 5.5h10.6A4 4 0 0 0 26 27L21 13V8" stroke="#2E2433" strokeWidth="2" fill="rgba(201,182,228,.35)"/>
            <path d="M9.2 24h15.6" stroke="#9B7FC4" strokeWidth="2"/>
          </svg>
          <div>
            <h1 className="font-serif font-medium text-2xl sm:text-3xl tracking-tight">Apothecary</h1>
            <p className="text-xs tracking-[.18em] uppercase text-ink-soft mt-0.5">Study Companion</p>
          </div>
        </div>
        <p className="text-sm text-ink-soft">
          Doses taken today &nbsp;
          <b className="font-serif text-lg text-ink font-semibold">{timer.dailyDoses}</b>
        </p>
      </header>

      {/* Main grid */}
      <main className="grid grid-cols-1 lg:grid-cols-[1.15fr_.85fr] gap-8 lg:gap-14">

        {/* Left: timer + quote */}
        <section className="flex flex-col items-center text-center">
          <PhaseTabs active={timer.phase} onChange={phase => dispatch({ type: "SET_PHASE", phase })} />

          <div className="mt-8">
            <VialTimer state={timer} dispatch={dispatch} />
          </div>

          <QuoteCard
            advanceSignal={timer.dailyDoses}
            paused={timer.status === "running"}
          />
        </section>

        {/* Right: goals + progress */}
        <aside className="flex flex-col gap-5">
          <div className="bg-paper border border-line rounded-card p-6 shadow-[0_1px_0_white_inset,0_8px_26px_-18px_rgba(46,36,51,.10)]">
            <GoalList
              onProgressChange={(done, total) => {
                setGoalsDone(done);
                setGoalsTotal(total);
              }}
            />
          </div>
          <RegimenProgress
            cyclePosition={cyclePosition}
            dailyDoses={timer.dailyDoses}
            goalsDone={goalsDone}
            goalsTotal={goalsTotal}
          />
        </aside>
      </main>

      <footer className="mt-12 pt-5 border-t border-line flex flex-wrap justify-between gap-3 text-xs text-ink-soft">
        <span className="font-serif italic">Each session is a measured dose — take care of yourself, Doc.</span>
        <span>Apothecary · v1</span>
      </footer>
    </div>
  );
}
```

---

## 13. Quality Checklist — Verify Before Done

- [ ] `tsc --strict` exits 0, ESLint exits 0
- [ ] Timer stays accurate after backgrounding the tab (timestamp-delta, not decrement-per-tick)
- [ ] State machine blocks illegal transitions (`PAUSE` while idle does nothing)
- [ ] Vial liquid: correct at 0%, 50%, 100%; no overflow past glass boundary
- [ ] Goals persist after reload; dated key rolls at local midnight; empty/whitespace inputs rejected
- [ ] `prefers-reduced-motion`: quote card falls back to plain fade, vial uses `duration:0`-equivalent
- [ ] Keyboard navigation: all buttons focusable, `aria-pressed` on phase tabs, `aria-label` on icon buttons
- [ ] No hardcoded hex outside `tailwind.config.ts`
- [ ] No Inter, Roboto, or Arial anywhere in the codebase
- [ ] Layout intact at 320px, 768px, 1200px, 2560px

**North star check:** Open it cold. Does the vial feel distinctive? Does the type feel editorial? Does the copy feel personal? If any of those is "no" — fix it before shipping.

---

## 14. Do Not

- Do not use a circular SVG ring for the timer
- Do not use Inter, Roboto, or Arial as the primary typeface
- Do not hardcode hex values in component files
- Do not add a backend, auth, or database in v1
- Do not add unrelated dependencies
- Do not rewrite a working module to fix a localized bug
- Do not leave empty `catch` blocks
- Do not use `any` — keep TypeScript strict throughout

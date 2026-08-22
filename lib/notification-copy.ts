import { shuffledOrder } from "./shuffle";
import type { NotificationEvent, NotificationVariant } from "@/types";

// Themed micro-copy for every notification event, grouped by family (core
// timer, break nudges, burnout alerts, milestones). Every headline is <= 28
// chars after %NAME% substitution so it never truncates as a tab title or OS
// notification title — see lib/notification-copy.test.ts.
export const NOTIFICATION_COPY: Record<NotificationEvent, readonly NotificationVariant[]> = {
  "focus-complete": [
    { headline: "Dose dispensed", note: "That's one measured dose down. Set the vial aside for a moment." },
    { headline: "Dose complete", note: "Twenty-five careful minutes, logged. Let the counter rest." },
    { headline: "Counter's clear", note: "Dose dispensed, %NAME%. Your refill is already poured." },
    { headline: "That's the dose", note: "Nicely measured. Step back before you pour the next one." },
    { headline: "Dose logged", note: "One more on today's prescription. Breathe before the refill." },
  ],
  "short-complete": [
    { headline: "Refill's done", note: "Five minutes back in the bottle. Ready when you are." },
    { headline: "Topped up", note: "The vial's full again. Take the next dose when you're steady." },
    { headline: "Refill complete", note: "Short and sufficient. Back to the counter, %NAME%." },
    { headline: "Back to the bench", note: "Rest taken as directed. The next dose is waiting." },
  ],
  "long-complete": [
    { headline: "Antidote's run its course", note: "A full fifteen. That's the reset — start fresh whenever you like." },
    { headline: "Antidote complete", note: "Long rest taken. You've earned a clean slate, %NAME%." },
    { headline: "Fully restored", note: "The long rest is done. Begin the next cycle unhurried." },
  ],
  "break-unstarted": [
    { headline: "Your refill is waiting", note: "The break's poured and sitting on the counter. Take it." },
    { headline: "Refill untouched", note: "It's been a few minutes. Rest is part of the prescription, not a break from it." },
    { headline: "Take the refill", note: "You measured the dose carefully. Measure the rest the same way." },
    { headline: "Rest is prescribed", note: "Two minutes since the bell, %NAME%. The refill won't take itself." },
  ],
  "paused-too-long": [
    { headline: "Session on hold", note: "The vial's been paused a while. Resume, or reset and start clean." },
    { headline: "Still paused", note: "No rush — but the counter's been quiet for ten minutes." },
  ],
  "no-antidote": [
    { headline: "Three doses, no rest", note: "That's three straight without a refill. Even good medicine needs spacing." },
    { headline: "Spacing matters", note: "You've skipped the rest twice over. Please take the next one, %NAME%." },
  ],
  "overdose": [
    { headline: "That's an overdose", note: "Five doses with no rest between. Stop and take the antidote — this one isn't optional." },
    { headline: "Exceeding the dose", note: "You're past what's safe to take in a row. The long rest is the prescription now." },
  ],
  "long-stretch": [
    { headline: "Four hours at the counter", note: "You've been dispensing since this morning. Close the shop for a bit." },
    { headline: "Long shift", note: "Four hours in. Whatever's left will still be here after a real break." },
  ],
  "late-hour": [
    { headline: "It's late, %NAME%", note: "The counter will still be here tomorrow. Sleep is the strongest dose there is." },
    { headline: "Past closing time", note: "Nothing you finish now will beat what rest gives you. Go on." },
  ],
  "first-dose": [
    { headline: "First dose of the day", note: "The shop's open and the first one's logged. Good start, %NAME%." },
    { headline: "Counter's open", note: "First dose down. The rest of the day follows this one." },
  ],
  "cycle-complete": [
    { headline: "Full cycle", note: "Four doses, a complete course. The long antidote is yours." },
    { headline: "Course complete", note: "That's the whole regimen. Take the fifteen — you finished the bottle." },
  ],
  "goals-cleared": [
    { headline: "All dispensed", note: "Every goal off the shelf. Today's prescription is filled, %NAME%." },
    { headline: "Prescription filled", note: "Nothing left on the list. That's a clean counter." },
  ],
};

// Arbitration order when two events would surface at once (e.g. a focus
// completion lands on the same tick as an overdose): burnout > milestone >
// nudge > core. Only one note is ever on screen; the higher number wins.
export const NOTIFICATION_PRIORITY: Record<NotificationEvent, number> = {
  "overdose": 40,
  "no-antidote": 39,
  "long-stretch": 38,
  "late-hour": 37,
  "goals-cleared": 30,
  "cycle-complete": 29,
  "first-dose": 28,
  "break-unstarted": 20,
  "paused-too-long": 19,
  "focus-complete": 10,
  "short-complete": 9,
  "long-complete": 8,
};

/** Remaining shuffle-bag indices per event, reshuffled once exhausted. */
export type NotificationBag = Partial<Record<NotificationEvent, number[]>>;

/**
 * Pure: picks the next variant for `event` out of `bag`, without repeating
 * any variant before every other variant in the event's list has been shown.
 * Returns the variant plus the bag's next state — no module state is
 * touched, so this unit-tests like timerReducer. The React layer holds the
 * bag in a useRef.
 */
export function nextVariant(
  event: NotificationEvent,
  bag: NotificationBag,
): { variant: NotificationVariant; bag: NotificationBag } {
  const variants = NOTIFICATION_COPY[event];
  const remaining = bag[event] && bag[event]!.length > 0 ? bag[event]! : shuffledOrder(variants.length);
  const [index, ...rest] = remaining;
  return {
    variant: variants[index],
    bag: { ...bag, [event]: rest },
  };
}

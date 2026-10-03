import { ADDRESS_TOKEN } from "@/lib/address-terms";
import type { DoseyMood } from "@/lib/dosey-mood";

export const POKE_LINES: readonly string[] = [
  `Easy there, ${ADDRESS_TOKEN} — I'm a capsule, not a stress ball.`,
  "One dose at a time.",
  "Hydrate. That's a prescription.",
  `Shoulders down, ${ADDRESS_TOKEN}. Unclench the jaw.`,
  "Small doses add up.",
  "Tomatoes are growing. Patience is part of the formula.",
  `Take as directed, ${ADDRESS_TOKEN}. Not all at once.`,
  "Rest is part of the treatment.",
  "I'm listening. Mostly to the ticking.",
  "Eyes up for a moment. Look at something far away.",
  `Flashcards fear you, ${ADDRESS_TOKEN}.`,
  "Recall first, reread second.",
  "Exams are just practice with a clock.",
];

export const MOOD_LINES: Record<DoseyMood, string> = {
  sleepy: "Zzz... wake me when the dose starts.",
  focused: "Shh — dose in progress.",
  relaxed: "Ahh. This part is the medicine.",
  proud: "Dose dispensed. Well done.",
};

/** Returns an index into POKE_LINES that differs from prevIndex (when possible). */
export function nextPokeLine(prevIndex: number, rand: () => number = Math.random): number {
  const n = POKE_LINES.length;
  if (n <= 1) return 0;
  const hasPrev = prevIndex >= 0 && prevIndex < n;
  const pool = hasPrev ? n - 1 : n;
  const pick = Math.min(pool - 1, Math.floor(rand() * pool));
  return hasPrev && pick >= prevIndex ? pick + 1 : pick;
}

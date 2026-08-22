import { ADDRESS_TOKEN } from "./address-terms";

export { shuffledOrder } from "./shuffle";

export type Quote = { text: string; author: string };

export const QUOTES: readonly Quote[] = [
  { text: "Small consistent doses compound into mastery.", author: `— for you, ${ADDRESS_TOKEN}` },
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
  { text: "Be patient with the process the way you are precise with the dose.", author: `— for you, ${ADDRESS_TOKEN}` },
  { text: "A calm mind is the best instrument you own. Tend to it.", author: "— a soft reminder" },
  { text: "You've handled harder than this chapter. Begin.", author: "— I believe in you" },
] as const;

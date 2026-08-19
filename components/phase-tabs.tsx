"use client";
import { motion, useReducedMotion } from "framer-motion";
import type { Phase } from "@/types";

const PHASES: { id: Phase; label: string }[] = [
  { id: "focus", label: "Dose" },
  { id: "short", label: "Refill" },
  { id: "long",  label: "Antidote" },
];

interface Props {
  active: Phase;
  onChange: (phase: Phase) => void;
}

export function PhaseTabs({ active, onChange }: Props) {
  const reduceMotion = useReducedMotion();
  return (
    <div
      role="group"
      aria-label="Session type"
      className="inline-flex bg-paper-2 border border-line rounded-full p-1 gap-0.5"
    >
      {PHASES.map(({ id, label }) => (
        <motion.button
          key={id}
          aria-pressed={active === id}
          onClick={() => onChange(id)}
          whileTap={reduceMotion ? undefined : { scale: 0.95 }}
          className={[
            "px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200",
            active === id
              ? "bg-paper text-ink shadow-sm"
              : "text-ink-soft hover:text-ink",
          ].join(" ")}
        >
          {label}
        </motion.button>
      ))}
    </div>
  );
}

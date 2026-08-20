"use client";
import { motion, useReducedMotion } from "framer-motion";
import type { Phase } from "@/types";
import { PHASE_ACCENT } from "@/lib/phase-theme";

const PHASES: { id: Phase; label: string }[] = [
  { id: "focus", label: "Dose" },
  { id: "short", label: "Refill" },
  { id: "long",  label: "Antidote" },
];

interface Props {
  active: Phase;
  isRunning: boolean;
  onChange: (phase: Phase) => void;
}

// Replicates Tailwind's shadow-sm as a literal string so the running-state
// ring can be layered in via the same `boxShadow` property without an
// inline-style-vs-class conflict (Framer Motion's `animate` always wins).
const IDLE_ACTIVE_SHADOW = "0 1px 2px 0 rgb(0 0 0 / 0.05)";

export function PhaseTabs({ active, isRunning, onChange }: Props) {
  const reduceMotion = useReducedMotion();
  return (
    <div
      role="group"
      aria-label="Session type"
      className="inline-flex bg-paper-2 border border-line rounded-full p-1 gap-0.5"
    >
      {PHASES.map(({ id, label }) => {
        const isActive = active === id;
        const showRing = isActive && isRunning;
        const accent = PHASE_ACCENT[id];
        const peakShadow = `${IDLE_ACTIVE_SHADOW}, 0 0 0 2px ${accent.base}, 0 0 18px 3px ${accent.deep}99`;
        const ringAnimate = reduceMotion
          ? { boxShadow: showRing ? peakShadow : IDLE_ACTIVE_SHADOW }
          : { boxShadow: showRing ? [IDLE_ACTIVE_SHADOW, peakShadow, IDLE_ACTIVE_SHADOW] : IDLE_ACTIVE_SHADOW };
        const ringTransition = !reduceMotion && showRing
          ? { duration: 3.5, repeat: Infinity, ease: "easeInOut" as const }
          : { duration: 0.3, ease: "easeOut" as const };
        return (
          <motion.button
            key={id}
            aria-pressed={isActive}
            onClick={() => onChange(id)}
            whileTap={reduceMotion ? undefined : { scale: 0.95 }}
            initial={false}
            animate={isActive ? ringAnimate : { boxShadow: "none" }}
            transition={isActive ? ringTransition : { duration: 0.15 }}
            className={[
              "px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200",
              isActive ? "bg-paper text-ink" : "text-ink-soft hover:text-ink",
            ].join(" ")}
          >
            {label}
          </motion.button>
        );
      })}
    </div>
  );
}

"use client";
import { motion, useReducedMotion } from "framer-motion";
import type { Phase } from "@/types";
import { PHASE_ACCENT } from "@/lib/phase-theme";
import { SPRING_UI } from "@/lib/motion";

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

const IDLE_PILL_SHADOW = "0 1px 0 rgba(255,255,255,.8) inset, 0 1px 2px rgba(46,36,51,.10), 0 3px 8px -4px rgba(46,36,51,.18)";

export function PhaseTabs({ active, isRunning, onChange }: Props) {
  const reduceMotion = useReducedMotion();
  const accent = PHASE_ACCENT[active];
  // The pill is a single shared-layout element that slides between tabs. While
  // running it carries a hairline accent ring and a soft breathing glow.
  const peakShadow = `${IDLE_PILL_SHADOW}, 0 0 0 1px ${accent.base}, 0 0 16px 2px ${accent.deep}55`;
  const pillAnimate = reduceMotion
    ? { boxShadow: isRunning ? peakShadow : IDLE_PILL_SHADOW }
    : { boxShadow: isRunning ? [IDLE_PILL_SHADOW, peakShadow, IDLE_PILL_SHADOW] : IDLE_PILL_SHADOW };
  const pillTransition = !reduceMotion && isRunning
    ? { boxShadow: { duration: 3.5, repeat: Infinity, ease: "easeInOut" as const }, layout: SPRING_UI }
    : { boxShadow: { duration: 0.3, ease: "easeOut" as const }, layout: SPRING_UI };

  return (
    <div
      role="group"
      aria-label="Session type"
      className="inline-flex bg-paper-2 border border-line rounded-full p-1 gap-0.5"
    >
      {PHASES.map(({ id, label }) => {
        const isActive = active === id;
        return (
          <motion.button
            key={id}
            aria-pressed={isActive}
            onClick={() => onChange(id)}
            whileTap={reduceMotion ? undefined : { scale: 0.96 }}
            transition={SPRING_UI}
            className={[
              "relative px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200",
              isActive ? "text-ink" : "text-ink-soft hover:text-ink",
            ].join(" ")}
          >
            {isActive && (
              <motion.span
                layoutId="phase-pill"
                aria-hidden
                className="absolute inset-0 rounded-full bg-paper"
                initial={false}
                animate={pillAnimate}
                transition={pillTransition}
              />
            )}
            <span className="relative">{label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

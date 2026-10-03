"use client";
import { motion, useReducedMotion } from "framer-motion";
import type { Phase } from "@/types";
import { PHASE_STICKER_CLASS } from "@/lib/phase-theme";
import { SPRING_BOUNCY, SPRING_UI } from "@/lib/motion";

const PHASES: { id: Phase; label: string; hint: string; name: string }[] = [
  { id: "focus", label: "Dose", hint: "Focus", name: "focus session" },
  { id: "short", label: "Refill", hint: "Short break", name: "short break" },
  { id: "long",  label: "Antidote", hint: "Long break", name: "long break" },
];

interface Props {
  active: Phase;
  isRunning: boolean;
  onChange: (phase: Phase) => void;
}

export function PhaseTabs({ active, onChange }: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      role="group"
      aria-label="Session type"
      className="flex w-full bg-surface-2 rounded-pill p-1.5 gap-1"
    >
      {PHASES.map(({ id, label, hint, name }) => {
        const isActive = active === id;
        return (
          <motion.button
            key={id}
            aria-pressed={isActive}
            aria-label={`${label} — ${name}`}
            onClick={() => onChange(id)}
            whileTap={{ scale: reduceMotion ? 1 : 0.96 }}
            transition={SPRING_BOUNCY}
            className={[
              "relative flex-1 min-h-[48px] cursor-pointer rounded-pill px-2 py-1 font-display text-base font-medium transition-colors duration-200",
              isActive ? "text-ink" : "text-ink-soft hover:text-ink",
            ].join(" ")}
          >
            {isActive && (
              <motion.span
                layoutId="phase-pill"
                aria-hidden
                className={`absolute inset-0 rounded-pill shadow-gum ${PHASE_STICKER_CLASS[id]}`}
                transition={reduceMotion ? { duration: 0 } : SPRING_UI}
              />
            )}
            <span className="relative flex flex-col items-center leading-tight">
              <span>{label}</span>
              <span className={`font-body text-xs font-normal ${isActive ? "text-ink" : "text-ink-soft"}`}>{hint}</span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

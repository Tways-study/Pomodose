"use client";
import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import type { Goal } from "@/types";
import { EASE_OUT, SPRING_BOUNCY } from "@/lib/motion";

interface Props {
  goal: Goal;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function GoalItem({ goal, onToggle, onDelete }: Props) {
  const reduceMotion = useReducedMotion();
  const draw = { duration: reduceMotion ? 0 : 0.25, ease: EASE_OUT };
  return (
    <motion.li
      layout={reduceMotion ? false : "position"}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.25, ease: EASE_OUT }}
      className="flex min-h-[56px] items-center gap-3 rounded-control bg-surface-2 py-1.5 pl-3 pr-2"
    >
      <motion.button
        aria-label={goal.done ? "Mark incomplete" : "Mark complete"}
        onClick={() => onToggle(goal.id)}
        whileTap={reduceMotion ? undefined : { scale: 0.88 }}
        transition={SPRING_BOUNCY}
        className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center rounded-pill"
      >
        <span
          className={[
            "flex h-7 w-7 items-center justify-center rounded-pill border-2 transition-colors duration-150",
            goal.done ? "border-gum-mint bg-gum-mint" : "border-line-strong bg-surface",
          ].join(" ")}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
            <motion.path
              d="M5.5 12.8 L10 17 L18.5 7.5"
              className="stroke-ink"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={false}
              animate={{ pathLength: goal.done ? 1 : 0, opacity: goal.done ? 1 : 0 }}
              transition={draw}
            />
          </svg>
        </span>
      </motion.button>

      <span
        className={[
          "relative flex-1 py-1 font-body text-base leading-snug transition-colors duration-150",
          goal.done ? "text-ink-soft" : "text-ink",
        ].join(" ")}
      >
        {goal.text}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 h-4 w-full -translate-y-1/2 overflow-visible"
          viewBox="0 0 100 16"
          preserveAspectRatio="none"
          fill="none"
        >
          <motion.path
            d="M1 9 C 12 3, 20 14, 32 8 S 52 3, 64 9 S 86 14, 99 7"
            className="stroke-gum-rose"
            strokeWidth={3}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            initial={false}
            animate={{ pathLength: goal.done ? 1 : 0, opacity: goal.done ? 1 : 0 }}
            transition={{ ...draw, duration: reduceMotion ? 0 : 0.35 }}
          />
        </svg>
      </span>

      <motion.button
        aria-label="Remove goal"
        onClick={() => onDelete(goal.id)}
        whileTap={reduceMotion ? undefined : { scale: 0.92 }}
        transition={SPRING_BOUNCY}
        className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center rounded-pill text-ink-soft transition-colors duration-150 hover:bg-gum-rose hover:text-ink"
      >
        <X size={20} strokeWidth={2.25} aria-hidden />
      </motion.button>
    </motion.li>
  );
}

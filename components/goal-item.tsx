"use client";
import { motion, useReducedMotion } from "framer-motion";
import type { Goal } from "@/types";
import { EASE_OUT } from "@/lib/motion";

interface Props {
  goal: Goal;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function GoalItem({ goal, onToggle, onDelete }: Props) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.25, ease: EASE_OUT }}
      className="flex items-center gap-3 px-3.5 py-3 bg-paper-2 border border-line rounded-xl"
    >
      {/* Checkmark button */}
      <motion.button
        aria-label={goal.done ? "Mark incomplete" : "Mark complete"}
        onClick={() => onToggle(goal.id)}
        whileTap={reduceMotion ? undefined : { scale: 0.95 }}
        className={[
          "flex-none w-5 h-5 rounded-md border-2 relative transition-colors duration-200",
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
          animate={{ opacity: goal.done ? 1 : 0, scale: goal.done ? 1 : 0.7 }}
          transition={{ duration: 0.2 }}
        >
          <path d="M2 7l3 3 6-7" className="stroke-paper" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </motion.button>

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
      <motion.button
        aria-label="Remove goal"
        onClick={() => onDelete(goal.id)}
        whileTap={reduceMotion ? undefined : { scale: 0.95 }}
        className="flex-none text-ink-soft hover:text-clay text-lg leading-none opacity-50 hover:opacity-100 transition-opacity duration-150"
      >
        ×
      </motion.button>
    </motion.li>
  );
}

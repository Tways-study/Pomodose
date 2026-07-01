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
          <path d="M2 7l3 3 6-7" className="stroke-paper" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
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

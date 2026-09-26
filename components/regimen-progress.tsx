"use client";
import { motion, useReducedMotion } from "framer-motion";
import { SETTINGS } from "@/lib/settings";
import { EASE_OUT, SPRING_SOFT } from "@/lib/motion";
import { PHASE_ACCENT, runningShadow } from "@/lib/phase-theme";
import type { Phase } from "@/types";

interface Props {
  cyclePosition: number;   // 0–3 (focus sessions completed in current cycle)
  dailyDoses: number;
  goalsDone: number;
  goalsTotal: number;
  phase: Phase;
  isRunning: boolean;
  isFocusRunning: boolean;
}

export function RegimenProgress({
  cyclePosition, dailyDoses, goalsDone, goalsTotal, phase, isRunning, isFocusRunning,
}: Props) {
  const reduceMotion = useReducedMotion();
  const pct = goalsTotal > 0 ? (goalsDone / goalsTotal) * 100 : 0;
  const accent = PHASE_ACCENT[phase];

  // Running-state card treatment: an accent hairline plus a soft glow
  // spill beneath, binary on/off via CSS transition (not a loop). Matches
  // the goal card's treatment in app/page.tsx.
  const shadowRunning = runningShadow(accent);

  return (
    <section
      className="bg-paper border border-line rounded-card shadow-card p-6 transition-[box-shadow] duration-700 ease-out"
      style={isRunning ? { boxShadow: shadowRunning } : undefined}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif font-semibold text-lg tracking-tight">Dose regimen</h2>
        <span className="text-xs tracking-widest uppercase text-ink-soft">Progress</span>
      </div>

      <div className="flex items-baseline justify-between mb-3">
        <div>
          <span className="font-serif text-4xl font-semibold text-ink">{goalsDone}</span>
          <span className="text-sm text-ink-soft"> / {goalsTotal} dispensed</span>
        </div>
        <div className="text-right">
          <span className="font-serif text-xl font-medium text-ink-soft">{cyclePosition}</span>
          <span className="text-xs text-ink-soft"> / {SETTINGS.CYCLE_LENGTH} to antidote</span>
        </div>
      </div>

      {/* Dose dots */}
      <div className="flex gap-2 flex-wrap mb-3">
        {Array.from({ length: SETTINGS.CYCLE_LENGTH }, (_, i) => {
          const isNext = isFocusRunning && i === cyclePosition;
          return (
            <div key={i} className="relative">
              {isNext && (
                <motion.div
                  aria-hidden
                  className="absolute -inset-2 rounded-full pointer-events-none"
                  style={{ boxShadow: `0 0 0 1.5px ${PHASE_ACCENT.focus.base}, 0 0 18px 3px ${PHASE_ACCENT.focus.deep}88` }}
                  initial={false}
                  animate={{
                    opacity: reduceMotion ? 0.9 : [0.5, 1, 0.5],
                    scale: reduceMotion ? 1 : [0.94, 1.1, 0.94],
                  }}
                  transition={
                    reduceMotion
                      ? { duration: 0.2 }
                      : { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
                  }
                />
              )}
              <motion.div
                animate={{ scale: i < cyclePosition ? 1.06 : 1 }}
                transition={reduceMotion ? { duration: 0 } : SPRING_SOFT}
                className={[
                  "w-6 h-6 rounded-full border-[1.5px] border-lilac-deep transition-colors duration-300",
                  i < cyclePosition ? "bg-lilac" : "bg-transparent",
                ].join(" ")}
              />
            </div>
          );
        })}
        <span className="text-xs text-ink-soft ml-1 self-center">{dailyDoses} total today</span>
      </div>

      {/* Goals progress bar */}
      <div className="h-1.5 rounded-full bg-paper-2 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-lilac to-lilac-deep"
          animate={{ width: `${pct}%` }}
          transition={{ duration: reduceMotion ? 0 : 0.6, ease: EASE_OUT }}
        />
      </div>
    </section>
  );
}

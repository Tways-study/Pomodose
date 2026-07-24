"use client";
import { motion } from "framer-motion";
import { SETTINGS } from "@/lib/settings";

interface Props {
  cyclePosition: number;   // 0–3 (focus sessions completed in current cycle)
  dailyDoses: number;
  goalsDone: number;
  goalsTotal: number;
}

export function RegimenProgress({ cyclePosition, dailyDoses, goalsDone, goalsTotal }: Props) {
  const pct = goalsTotal > 0 ? (goalsDone / goalsTotal) * 100 : 0;

  return (
    <section className="bg-paper border border-line rounded-card p-6 shadow-[0_1px_0_white_inset,0_8px_26px_-18px_rgba(46,36,51,.10)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif font-semibold text-lg tracking-tight">Dose regimen</h2>
        <span className="text-xs tracking-widest uppercase text-ink-soft">Progress</span>
      </div>

      <div className="flex items-baseline justify-between mb-3">
        <div>
          <span className="font-serif text-3xl font-semibold">{goalsDone}</span>
          <span className="text-sm text-ink-soft"> / {goalsTotal} dispensed</span>
        </div>
        <div className="text-right">
          <span className="font-serif text-3xl font-semibold">{cyclePosition}</span>
          <span className="text-sm text-ink-soft"> / {SETTINGS.CYCLE_LENGTH} to antidote</span>
        </div>
      </div>

      {/* Dose dots */}
      <div className="flex gap-2 flex-wrap mb-3">
        {Array.from({ length: SETTINGS.CYCLE_LENGTH }, (_, i) => (
          <motion.div
            key={i}
            animate={{ scale: i < cyclePosition ? 1.06 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={[
              "w-6 h-6 rounded-full border-[1.5px] border-lilac-deep transition-colors duration-300",
              i < cyclePosition ? "bg-lilac" : "bg-transparent",
            ].join(" ")}
          />
        ))}
        <span className="text-xs text-ink-soft ml-1 self-center">{dailyDoses} total today</span>
      </div>

      {/* Goals progress bar */}
      <div className="h-1.5 rounded-full bg-paper-2 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-lilac to-lilac-deep"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </section>
  );
}

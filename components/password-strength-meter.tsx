"use client";
import { motion, useReducedMotion } from "framer-motion";
import { assessPasswordStrength } from "@/lib/password-strength";
import { EASE_OUT } from "@/lib/motion";

interface Props {
  password: string;
}

/**
 * Advisory strength readout shown under a new-password field (register,
 * reset-verify) — never a hard gate on submission. Reuses the goals progress
 * bar's exact token pattern (paper-2 track, lilac→lilac-deep fill) rather
 * than introducing new meter colors; sage and amber stay reserved for goal
 * completion and running-state chrome per DESIGN.md. The label conveys the
 * level in words, not color alone.
 */
export function PasswordStrengthMeter({ password }: Props) {
  const reduceMotion = useReducedMotion();
  const { level, score, label } = assessPasswordStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2" aria-label="Password strength">
      <div className="h-1.5 rounded-full bg-paper-2 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-lilac to-lilac-deep"
          animate={{ width: `${(score / 4) * 100}%` }}
          transition={{ duration: reduceMotion ? 0 : 0.3, ease: EASE_OUT }}
        />
      </div>
      <p
        aria-live="polite"
        className={`mt-1 text-xs ${level === "weak" ? "text-clay-deep" : "text-ink-soft"}`}
      >
        {label}
      </p>
    </div>
  );
}

"use client";
import { motion, useReducedMotion } from "framer-motion";
import { assessPasswordStrength, type PasswordStrengthLevel } from "@/lib/password-strength";
import { EASE_OUT } from "@/lib/motion";

interface Props {
  password: string;
}

/**
 * Advisory strength readout shown under a new-password field (register,
 * reset-verify) — never a hard gate on submission. Sticker colors on a
 * surface-2 track; the label conveys the level in words, not color alone.
 */
const LEVEL_FILL: Record<PasswordStrengthLevel, string> = {
  weak: "bg-gum-apricot",
  fair: "bg-gum-butter",
  good: "bg-gum-mint",
  strong: "bg-gum-mint",
};

export function PasswordStrengthMeter({ password }: Props) {
  const reduceMotion = useReducedMotion();
  const { level, score, label } = assessPasswordStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2" aria-label="Password strength">
      <div className="h-2 rounded-pill bg-surface-2 overflow-hidden">
        <motion.div
          className={`h-full rounded-pill ${LEVEL_FILL[level]}`}
          animate={{ width: `${(score / 4) * 100}%` }}
          transition={{ duration: reduceMotion ? 0 : 0.3, ease: EASE_OUT }}
        />
      </div>
      <p
        aria-live="polite"
        className="mt-1 font-body text-xs text-ink-soft"
      >
        {label}
      </p>
    </div>
  );
}

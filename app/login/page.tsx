"use client";

import { motion, useReducedMotion } from "framer-motion";
import { DoseyRig } from "@/components/dosey/dosey-rig";
import { LoginForm } from "@/components/login-form";
import { EASE_OUT } from "@/lib/motion";

export default function LoginPage() {
  const reduceMotion = useReducedMotion();

  const enter = (delay: number) => ({
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduceMotion ? 0.3 : 0.4, delay, ease: EASE_OUT },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-ground px-4 py-12">
      <div className="w-full max-w-sm">
        <motion.div className="mb-6 flex items-center gap-3" {...enter(0)}>
          <DoseyRig size={72} mood="relaxed" />
          <div className="leading-tight">
            <h1 className="font-display text-3xl font-semibold text-ink">Pomodose</h1>
            <p className="font-body text-ink">Focus timer for pharmacy students</p>
          </div>
        </motion.div>

        <motion.div
          className="rounded-bubble border border-line-soft bg-surface text-ink shadow-soft"
          {...enter(0.08)}
        >
          <div className="p-5 sm:p-6">
            <LoginForm />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

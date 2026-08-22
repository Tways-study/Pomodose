"use client";

import { motion, useReducedMotion } from "framer-motion";
import { LoginForm } from "@/components/login-form";
import { VialMark } from "@/components/vial-mark";
import { EASE_OUT } from "@/lib/motion";

export default function LoginPage() {
  const reduceMotion = useReducedMotion();

  const enter = (delay: number) => ({
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, filter: "blur(4px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: reduceMotion ? 0.3 : 0.5, delay, ease: EASE_OUT },
  });

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{ background: "radial-gradient(50% 50% at 50% 38%, #C9B6E4 0%, transparent 65%)" }}
        initial={false}
        animate={{ opacity: reduceMotion ? 0.12 : [0.08, 0.16, 0.08] }}
        transition={
          reduceMotion
            ? { duration: 0.4, ease: "easeOut" as const }
            : { duration: 3.5, repeat: Infinity, ease: "easeInOut" as const }
        }
      />

      <div className="relative z-10 w-full max-w-sm">
        <motion.div className="flex flex-col items-center gap-2 mb-6" {...enter(0)}>
          <VialMark />
          <h1 className="font-serif font-medium text-2xl tracking-tight">Pomodose</h1>
        </motion.div>

        <motion.div
          className="bg-paper border border-line rounded-card p-6 sm:p-8 shadow-[0_1px_0_white_inset,0_18px_50px_-24px_rgba(46,36,51,.35)]"
          {...enter(0.09)}
        >
          <LoginForm />
        </motion.div>
      </div>
    </div>
  );
}

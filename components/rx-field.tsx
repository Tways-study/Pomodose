"use client";
import { motion, useReducedMotion } from "framer-motion";

interface RxConfig {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  sway: number;
  rotation: number;
}

// Hand-authored spread — left positions cluster loosely so symbols rise in
// a few distinct streams rather than an even grid. Sizes/durations/delays
// vary independently so no two neighbors share a rhythm.
const SYMBOLS: RxConfig[] = [
  { id: 1, left: 7,  size: 18, duration: 22, delay: 0,   sway: 20, rotation: -8  },
  { id: 2, left: 18, size: 14, duration: 26, delay: 5.5, sway: 26, rotation: 11  },
  { id: 3, left: 32, size: 20, duration: 19, delay: 2.2, sway: 16, rotation: -5  },
  { id: 4, left: 46, size: 16, duration: 24, delay: 8.0, sway: 22, rotation: 9   },
  { id: 5, left: 60, size: 18, duration: 21, delay: 3.8, sway: 18, rotation: -12 },
  { id: 6, left: 75, size: 14, duration: 27, delay: 6.5, sway: 24, rotation: 6   },
  { id: 7, left: 88, size: 16, duration: 20, delay: 1.4, sway: 20, rotation: -7  },
];

interface Props {
  accent: { base: string; deep: string };
  active: boolean;
}

export function RxField({ accent, active }: Props) {
  const reduceMotion = useReducedMotion();
  // Frozen mid-air prescription symbols read as a glitch, not a calm resting
  // state. Absent entirely under prefers-reduced-motion.
  if (reduceMotion) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {SYMBOLS.map(s => (
        <motion.div
          key={s.id}
          className="absolute font-serif select-none"
          style={{
            left: `${s.left}%`,
            bottom: -32,
            fontSize: s.size,
            color: accent.base,
            fontStyle: "italic",
            transform: `rotate(${s.rotation}deg)`,
            userSelect: "none",
          }}
          initial={{ opacity: 0, x: 0, y: 0 }}
          animate={
            active
              ? {
                  opacity: [0, 0.18, 0.14, 0],
                  x: [0, s.sway, -s.sway * 0.4, s.sway * 0.2, 0],
                  y: [0, "-108vh"],
                }
              : { opacity: 0, x: 0, y: 0 }
          }
          transition={
            active
              ? {
                  opacity: { duration: s.duration, delay: s.delay, repeat: Infinity, ease: "easeInOut", times: [0, 0.12, 0.78, 1] },
                  x:       { duration: s.duration, delay: s.delay, repeat: Infinity, ease: "easeInOut", times: [0, 0.25, 0.65, 0.85, 1] },
                  y:       { duration: s.duration, delay: s.delay, repeat: Infinity, ease: "easeIn" },
                }
              : { duration: 0.5, ease: "easeOut" }
          }
        >
          Rx
        </motion.div>
      ))}
    </div>
  );
}

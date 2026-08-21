"use client";
import { motion, useReducedMotion } from "framer-motion";

interface WispConfig {
  id: number;
  left: number;
  width: number;
  height: number;
  duration: number;
  delay: number;
  sway: number;
  blur: number;
}

// Hand-authored spread — left positions cluster loosely so wisps rise in
// a few distinct streams rather than an even grid. Sizes/durations/delays
// vary independently so no two neighbors share a rhythm.
const WISPS: WispConfig[] = [
  { id: 1, left: 6,  width: 8,  height: 28, duration: 14, delay: 0,   sway: 22, blur: 6 },
  { id: 2, left: 16, width: 12, height: 36, duration: 18, delay: 4.5, sway: 28, blur: 8 },
  { id: 3, left: 28, width: 7,  height: 22, duration: 12, delay: 1.8, sway: 18, blur: 5 },
  { id: 4, left: 40, width: 14, height: 42, duration: 20, delay: 7.2, sway: 32, blur: 9 },
  { id: 5, left: 52, width: 9,  height: 30, duration: 15, delay: 3.1, sway: 24, blur: 6 },
  { id: 6, left: 63, width: 11, height: 35, duration: 17, delay: 9.4, sway: 27, blur: 7 },
  { id: 7, left: 74, width: 7,  height: 24, duration: 13, delay: 5.6, sway: 20, blur: 5 },
  { id: 8, left: 85, width: 13, height: 40, duration: 19, delay: 2.3, sway: 30, blur: 8 },
  { id: 9, left: 94, width: 8,  height: 26, duration: 11, delay: 8.7, sway: 22, blur: 6 },
];

interface Props {
  accent: { base: string; deep: string };
  active: boolean;
}

export function WispField({ accent, active }: Props) {
  const reduceMotion = useReducedMotion();
  // A field of mid-air frozen wisps isn't a calm resting state — it reads as
  // a glitch, not reduced motion. Absent entirely under prefers-reduced-motion.
  if (reduceMotion) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {WISPS.map(w => (
        <motion.div
          key={w.id}
          className="absolute"
          style={{
            left: `${w.left}%`,
            bottom: -w.height,
            width: w.width,
            height: w.height,
            borderRadius: "50%",
            background: `linear-gradient(to top, transparent 0%, ${accent.base}55 35%, ${accent.base}22 75%, transparent 100%)`,
            filter: `blur(${w.blur}px)`,
          }}
          initial={{ opacity: 0, x: 0, y: 0, scaleX: 1, scaleY: 1 }}
          animate={
            active
              ? {
                  opacity: [0, 0.28, 0.22, 0],
                  x: [0, w.sway, -w.sway * 0.5, w.sway * 0.25, 0],
                  y: [0, "-110vh"],
                  scaleX: [1, 1.35, 1.8],
                  scaleY: [1, 0.88, 0.72],
                }
              : { opacity: 0, x: 0, y: 0, scaleX: 1, scaleY: 1 }
          }
          transition={
            active
              ? {
                  opacity: { duration: w.duration, delay: w.delay, repeat: Infinity, ease: "easeInOut", times: [0, 0.15, 0.75, 1] },
                  x:       { duration: w.duration, delay: w.delay, repeat: Infinity, ease: "easeInOut", times: [0, 0.25, 0.65, 0.85, 1] },
                  y:       { duration: w.duration, delay: w.delay, repeat: Infinity, ease: "easeIn" },
                  scaleX:  { duration: w.duration, delay: w.delay, repeat: Infinity, ease: "easeIn", times: [0, 0.5, 1] },
                  scaleY:  { duration: w.duration, delay: w.delay, repeat: Infinity, ease: "easeIn", times: [0, 0.5, 1] },
                }
              : { duration: 0.5, ease: "easeOut" }
          }
        />
      ))}
    </div>
  );
}

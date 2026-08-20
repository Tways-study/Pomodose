"use client";
import { motion, useReducedMotion } from "framer-motion";

interface BubbleConfig {
  id: number;
  left: number;     // % from left edge, 0–100
  size: number;      // diameter, px
  duration: number;  // one full rise cycle, seconds
  delay: number;     // stagger before first rise, seconds
  wobble: number;    // horizontal drift amplitude, px
}

// Hand-authored, deliberately irregular spread across the full viewport width
// — left positions cluster in a few places and gap in others (loose rising
// streams, not an even grid). Sizes/durations/delays vary independently of
// position so no two neighboring bubbles share a rhythm.
const BUBBLES: BubbleConfig[] = [
  { id: 1,  left: 4,  size: 9,  duration: 8.5,  delay: 0,   wobble: 5  },
  { id: 2,  left: 8,  size: 15, duration: 10.5, delay: 3.2, wobble: 9  },
  { id: 3,  left: 17, size: 7,  duration: 7,    delay: 1.4, wobble: 4  },
  { id: 4,  left: 21, size: 18, duration: 11.5, delay: 6.6, wobble: 10 },
  { id: 5,  left: 33, size: 11, duration: 9,    delay: 4.8, wobble: 7  },
  { id: 6,  left: 36, size: 20, duration: 12.5, delay: 0.6, wobble: 12 },
  { id: 7,  left: 48, size: 8,  duration: 7.5,  delay: 8.2, wobble: 5  },
  { id: 8,  left: 52, size: 14, duration: 10,   delay: 2.4, wobble: 8  },
  { id: 9,  left: 60, size: 22, duration: 13,   delay: 5.4, wobble: 13 },
  { id: 10, left: 70, size: 10, duration: 8,    delay: 9.6, wobble: 6  },
  { id: 11, left: 74, size: 16, duration: 11,   delay: 1.8, wobble: 9  },
  { id: 12, left: 83, size: 7,  duration: 7.2,  delay: 7,   wobble: 4  },
  { id: 13, left: 90, size: 13, duration: 9.5,  delay: 3.8, wobble: 7  },
  { id: 14, left: 96, size: 19, duration: 12,   delay: 6.2, wobble: 11 },
];

interface Props {
  accent: { base: string; deep: string };
  active: boolean;
}

export function BubbleField({ accent, active }: Props) {
  const reduceMotion = useReducedMotion();
  // A field of rising bubbles frozen mid-air isn't a calm resting state the
  // way a paused opacity pulse is — it would read as a glitch, not motion-
  // reduced. Simplest, safest fallback: the effect is absent entirely under
  // prefers-reduced-motion rather than present-but-static.
  if (reduceMotion) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {BUBBLES.map(b => (
        <motion.div
          key={b.id}
          className="absolute rounded-full"
          style={{
            left: `${b.left}%`,
            bottom: -b.size,
            width: b.size,
            height: b.size,
            background: `radial-gradient(circle at 30% 28%, rgba(255,255,255,0.55) 0%, ${accent.base}55 24%, ${accent.deep}30 58%, transparent 78%)`,
            border: `1px solid ${accent.base}40`,
          }}
          initial={false}
          animate={
            active
              ? {
                  opacity: [0, 0.55, 0.55, 0],
                  x: [0, b.wobble, -b.wobble * 0.6, b.wobble * 0.3, 0],
                  y: [0, "-112vh"],
                  scale: [0.85, 1, 1.1],
                }
              : { opacity: 0, x: 0, y: 0, scale: 0.85 }
          }
          transition={
            active
              ? {
                  opacity: { duration: b.duration, delay: b.delay, repeat: Infinity, ease: "easeInOut", times: [0, 0.12, 0.8, 1] },
                  x:       { duration: b.duration, delay: b.delay, repeat: Infinity, ease: "easeInOut", times: [0, 0.3, 0.6, 0.85, 1] },
                  y:       { duration: b.duration, delay: b.delay, repeat: Infinity, ease: "easeInOut" },
                  scale:   { duration: b.duration, delay: b.delay, repeat: Infinity, ease: "easeInOut", times: [0, 0.4, 1] },
                }
              : { duration: 0.4, ease: "easeOut" }
          }
        />
      ))}
    </div>
  );
}

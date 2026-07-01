"use client";

import { useEffect, type Dispatch } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { TimerState } from "@/types";
import type { TimerAction } from "@/lib/timer-machine";

// --- Vial geometry (SVG user units) -----------------------------------------
const VIAL_TOP = 44;    // y where liquid starts, just below the neck
const VIAL_BOTTOM = 205; // y at the bottom of the glass
const VIAL_RANGE = VIAL_BOTTOM - VIAL_TOP; // 161px

// Fillable interior of the glass body (also used as the liquid clip region).
const BODY_PATH =
  "M 62 36 C 62 50, 44 52, 44 68 L 44 196 Q 44 214, 62 214 " +
  "L 88 214 Q 106 214, 106 196 L 106 68 C 106 52, 88 50, 88 36 Z";
const NECK_PATH = "M 62 36 L 62 20 L 88 20 L 88 36";

const PHASE_LABEL: Record<TimerState["phase"], string> = {
  focus: "Focus",
  short: "Short break",
  long: "Long break",
};

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mm = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

interface Props {
  state: TimerState;
  dispatch: Dispatch<TimerAction>;
}

export function VialTimer({ state, dispatch }: Props) {
  const reduceMotion = useReducedMotion();

  // --- Countdown tick: timestamp-delta driven so backgrounded tabs stay true ---
  useEffect(() => {
    if (state.status !== "running") return;
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - (state.startedAt ?? Date.now())) / 1000);
      if (elapsed >= state.total) {
        dispatch({ type: "COMPLETE" });
      } else {
        dispatch({ type: "TICK" });
      }
    }, 1000);
    return () => clearInterval(id);
  }, [state.status, state.startedAt, state.total, dispatch]);

  // --- Liquid level ----------------------------------------------------------
  const ratio = state.total > 0 ? state.remaining / state.total : 0;
  // Focus drains; rests "top up" (invert) to signal refilling.
  const fillFraction = state.phase === "focus" ? ratio : 1 - ratio;
  const clamped = Math.min(1, Math.max(0, fillFraction));
  const height = VIAL_RANGE * clamped;
  const y = VIAL_BOTTOM - height;

  const liquidTransition = reduceMotion
    ? { duration: 0 }
    : { type: "tween" as const, duration: 0.8, ease: [0.22, 1, 0.36, 1] as const };

  // --- Primary control label / action ----------------------------------------
  const primary =
    state.status === "running"
      ? { label: "Pause", action: { type: "PAUSE" as const } }
      : state.status === "paused"
        ? { label: "Resume", action: { type: "RESUME" as const } }
        : { label: "Begin dose", action: { type: "START" as const } };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg
          viewBox="0 0 150 224"
          className="w-[180px] h-auto"
          role="img"
          aria-label={`${PHASE_LABEL[state.phase]} timer, ${formatTime(state.remaining)} remaining`}
        >
          <defs>
            <clipPath id="vial-clip">
              <path d={BODY_PATH} />
            </clipPath>
          </defs>

          {/* Empty glass tint */}
          <path d={BODY_PATH} className="fill-paper-2" />

          {/* Liquid + meniscus, constrained to the glass interior */}
          <g clipPath="url(#vial-clip)">
            <motion.rect
              x={38}
              width={78}
              className="fill-lilac"
              initial={false}
              animate={{ y, height }}
              transition={liquidTransition}
            />
            <motion.ellipse
              cx={75}
              rx={31}
              ry={3.5}
              className="fill-lilac-deep"
              initial={false}
              animate={{ cy: y, opacity: clamped > 0 && clamped < 1 ? 0.9 : 0 }}
              transition={liquidTransition}
            />
          </g>

          {/* Measure ticks at 3/4, 1/2, 1/4 heights */}
          <g className="stroke-lilac-deep" strokeWidth={1.5} strokeLinecap="round" opacity={0.5}>
            <line x1={96} x2={104} y1={VIAL_BOTTOM - VIAL_RANGE * 0.75} y2={VIAL_BOTTOM - VIAL_RANGE * 0.75} />
            <line x1={96} x2={104} y1={VIAL_BOTTOM - VIAL_RANGE * 0.5} y2={VIAL_BOTTOM - VIAL_RANGE * 0.5} />
            <line x1={96} x2={104} y1={VIAL_BOTTOM - VIAL_RANGE * 0.25} y2={VIAL_BOTTOM - VIAL_RANGE * 0.25} />
          </g>

          {/* Glass outline over the liquid for a crisp edge */}
          <path d={BODY_PATH} className="fill-none stroke-ink" strokeWidth={2} strokeLinejoin="round" />

          {/* Neck + cap */}
          <path d={NECK_PATH} className="fill-none stroke-ink" strokeWidth={2} strokeLinejoin="round" />
          <rect x={57} y={3} width={36} height={15} rx={5} className="fill-lilac stroke-ink" strokeWidth={2} />
        </svg>

        {/* Centered readout over the vial */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-serif timer-display text-4xl font-semibold tabular-nums">
            {formatTime(state.remaining)}
          </span>
          <span className="text-ink-soft text-xs tracking-widest uppercase mt-1">
            {PHASE_LABEL[state.phase]}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mt-7">
        <button
          onClick={() => dispatch(primary.action)}
          className="px-6 py-2.5 rounded-full bg-ink text-paper text-sm font-medium hover:opacity-90 transition-opacity duration-200"
        >
          {primary.label}
        </button>
        <button
          onClick={() => dispatch({ type: "RESET" })}
          className="px-5 py-2.5 rounded-full border border-line text-ink-soft text-sm font-medium hover:text-ink hover:border-ink-soft transition-colors duration-200"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

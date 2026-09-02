"use client";

import { useEffect, useRef, useState, type Dispatch } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { TimerState } from "@/types";
import type { TimerAction } from "@/lib/timer-machine";
import { EASE_OUT } from "@/lib/motion";
import { startCompletionAlert, stopCompletionAlert } from "@/lib/chime";
import { PHASE_LABEL, formatTime } from "@/lib/timer-format";
import { setRunningTitle, resetTitle } from "@/lib/document-title";
import { PHASE_ACCENT } from "@/lib/phase-theme";
import { useNotify } from "@/components/notification-provider";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { todayKey } from "@/lib/date";

// --- Flask Geometry (SVG user units, 180 x 230 viewBox) ----------------------
const FLASK_TOP = 54;
const FLASK_BOTTOM = 206;
const FLASK_RANGE = FLASK_BOTTOM - FLASK_TOP; // 152px

const FLASK_BODY_PATH =
  "M 74 24 L 74 54 C 74 68, 18 155, 18 194 Q 18 208, 32 208 L 148 208 Q 162 208, 162 194 C 162 155, 106 68, 106 54 L 106 24 Z";

// --- Graduated Cylinder Geometry (180 x 230 viewBox) -----------------------
const CYLINDER_TOP = 28;
const CYLINDER_BOTTOM = 190;
const CYLINDER_RANGE = CYLINDER_BOTTOM - CYLINDER_TOP; // 162px

const CYLINDER_BODY_PATH =
  "M 56 16 L 68 26 L 68 184 Q 68 192, 76 192 L 104 192 Q 112 192, 112 184 L 112 26 L 118 20 L 112 20 L 68 20 Z";

interface Props {
  state: TimerState;
  dispatch: Dispatch<TimerAction>;
}

export function VialTimer({ state, dispatch }: Props) {
  const [vessel, setVessel] = useState<"flask" | "cylinder">("flask");
  const reduceMotion = useReducedMotion();
  const justCompletedRef = useRef(false);
  const notify = useNotify();
  const { isAuthenticated } = useConvexAuth();
  const logSession = useMutation(api.sessions.log);

  // --- Countdown tick: timestamp-delta driven so backgrounded tabs stay true ---
  useEffect(() => {
    if (state.status !== "running") return;
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - (state.startedAt ?? Date.now())) / 1000);
      if (elapsed >= state.total) {
        startCompletionAlert();
        justCompletedRef.current = true;
        // The provider owns the tab title from here — it flashes the
        // headline for whichever themed variant it picks for this event.
        notify(
          state.phase === "focus" ? "focus-complete" : state.phase === "short" ? "short-complete" : "long-complete",
        );
        // Persist the finished session so the day's counters survive a reload.
        // Deliberately fire-and-forget: a failed write must never block the
        // phase transition or the completion alert. The in-page counters stay
        // correct for this session either way; only the reload survives it.
        if (isAuthenticated) {
          void logSession({
            phase: state.phase,
            durationSeconds: state.total,
            date: todayKey(),
          }).catch((err) => {
            console.error("Failed to log completed session", err);
          });
        }
        dispatch({ type: "COMPLETE" });
      } else {
        dispatch({ type: "TICK" });
      }
    }, 1000);
    return () => clearInterval(id);
  }, [state.status, state.startedAt, state.total, state.phase, notify, dispatch, isAuthenticated, logSession]);

  // --- Tab title: live countdown while running; hand off to the completion
  // flash (already started above) instead of stomping it when idle is reached
  // via COMPLETE, but reset it for any other idle transition (Reset, phase switch).
  useEffect(() => {
    if (state.status === "running") {
      setRunningTitle(state.phase, state.remaining);
    } else if (state.status === "idle") {
      if (justCompletedRef.current) {
        justCompletedRef.current = false;
      } else {
        resetTitle();
      }
    }
  }, [state.status, state.phase, state.remaining]);

  useEffect(() => () => {
    resetTitle();
    stopCompletionAlert();
  }, []);

  // --- Liquid level ----------------------------------------------------------
  const ratio = state.total > 0 ? state.remaining / state.total : 0;
  // Focus drains; rests "top up" (invert) to signal refilling.
  const fillFraction = state.phase === "focus" ? ratio : 1 - ratio;
  const clamped = Math.min(1, Math.max(0, fillFraction));

  const isFlask = vessel === "flask";
  const bottomY = isFlask ? FLASK_BOTTOM : CYLINDER_BOTTOM;
  const range = isFlask ? FLASK_RANGE : CYLINDER_RANGE;

  const height = range * clamped;
  const y = bottomY - height;

  // Meniscus rx for flask scales with height (wider at bottom, narrower at top)
  const meniscusRx = isFlask ? 16 + 48 * (1 - clamped) : 22;

  const liquidTransition = reduceMotion
    ? { duration: 0 }
    : { type: "tween" as const, duration: 0.8, ease: EASE_OUT };

  // --- "Session is running" ambient halo ---------------------------------
  const isRunning = state.status === "running";
  const phaseAccent = PHASE_ACCENT[state.phase];
  const haloOpacity = reduceMotion
    ? (isRunning ? 0.4 : 0)
    : (isRunning ? [0.3, 0.55, 0.3] : 0);
  const haloTransition = !reduceMotion && isRunning
    ? { duration: 3.5, repeat: Infinity, ease: "easeInOut" as const }
    : { duration: 0.3, ease: "easeOut" as const };

  // --- Primary control label / action ----------------------------------------
  const primary =
    state.status === "running"
      ? { label: "Pause", action: { type: "PAUSE" as const } }
      : state.status === "paused"
        ? { label: "Resume", action: { type: "RESUME" as const } }
        : { label: `Begin ${PHASE_LABEL[state.phase].toLowerCase()}`, action: { type: "START" as const } };

  return (
    <div className="flex flex-col items-center">
      {/* Vessel Shape Selector */}
      <div className="flex items-center gap-1 bg-paper-2/80 p-1 rounded-full text-xs mb-5 border border-line">
        <motion.button
          onClick={() => setVessel("flask")}
          whileTap={reduceMotion ? undefined : { scale: 0.95 }}
          className={`px-3 py-1 rounded-full transition-colors duration-200 ${
            vessel === "flask"
              ? "bg-paper text-ink font-medium shadow-sm"
              : "text-ink-soft hover:text-ink"
          }`}
          aria-label="Switch to Flask view"
        >
          Flask
        </motion.button>
        <motion.button
          onClick={() => setVessel("cylinder")}
          whileTap={reduceMotion ? undefined : { scale: 0.95 }}
          className={`px-3 py-1 rounded-full transition-colors duration-200 ${
            vessel === "cylinder"
              ? "bg-paper text-ink font-medium shadow-sm"
              : "text-ink-soft hover:text-ink"
          }`}
          aria-label="Switch to Graduated Cylinder view"
        >
          Graduated Cylinder
        </motion.button>
      </div>

      {/* Prominent Readout Display (100% visible with zero line overlap) */}
      <div className="flex flex-col items-center mb-4">
        <span
          className="font-serif timer-display text-6xl tabular-nums text-ink tracking-[-0.02em]"
          style={{ fontVariationSettings: '"opsz" 72, "wght" 500' }}
        >
          {formatTime(state.remaining)}
        </span>
        <span
          className={`text-xs tracking-widest uppercase mt-1 transition-colors duration-500${isRunning ? "" : " text-ink-soft"}`}
          style={{ color: isRunning ? phaseAccent.deep : undefined }}
        >
          {PHASE_LABEL[state.phase]}
        </span>
      </div>

      {/* Vessel Graphic */}
      <div className="relative">
        <svg
          viewBox="0 0 180 230"
          className="w-[200px] h-auto"
          role="img"
          aria-label={`${PHASE_LABEL[state.phase]} timer, ${formatTime(state.remaining)} remaining`}
        >
          <defs>
            <clipPath id="vessel-clip">
              <path d={isFlask ? FLASK_BODY_PATH : CYLINDER_BODY_PATH} />
            </clipPath>
            <filter id="vial-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="10" />
            </filter>
          </defs>

          {/* Ambient halo — signals a session is running. Traces the vessel's own
              silhouette (not a plain circle) so the blurred bleed always clears
              the opaque glass-interior fill painted on top of it, for either
              vessel shape, instead of mostly disappearing behind it. */}
          <motion.path
            d={isFlask ? FLASK_BODY_PATH : CYLINDER_BODY_PATH}
            className="fill-lilac"
            filter="url(#vial-glow)"
            initial={{ opacity: 0 }}
            animate={{ opacity: haloOpacity }}
            transition={haloTransition}
          />

          {/* Base for Cylinder */}
          {!isFlask && (
            <path
              d="M 48 190 L 34 204 L 44 216 L 136 216 L 146 204 L 132 190 Z"
              className="fill-paper-2 stroke-ink"
              strokeWidth={2}
              strokeLinejoin="round"
            />
          )}

          {/* Empty glass interior tint */}
          <path d={isFlask ? FLASK_BODY_PATH : CYLINDER_BODY_PATH} className="fill-paper-2" />

          {/* Liquid + meniscus, constrained to the glass interior */}
          <g clipPath="url(#vessel-clip)">
            <motion.rect
              x={0}
              width={180}
              className="fill-lilac"
              initial={{ y, height }}
              animate={{ y, height }}
              transition={liquidTransition}
            />
            <motion.ellipse
              cx={90}
              rx={meniscusRx}
              ry={3.5}
              className="fill-lilac-deep"
              initial={{ cy: y, opacity: 0 }}
              animate={{ cy: y, opacity: clamped > 0 && clamped < 1 ? 0.9 : 0 }}
              transition={liquidTransition}
            />
          </g>

          {/* Graduations only on Cylinder (Flask is kept completely clean) */}
          {!isFlask && (
            <g className="stroke-lilac-deep fill-ink-soft" opacity={0.7}>
              {[1.0, 0.8, 0.6, 0.4, 0.2].map((frac) => {
                const tickY = CYLINDER_BOTTOM - CYLINDER_RANGE * frac;
                const val = Math.round(frac * 100);
                return (
                  <g key={frac}>
                    <line x1={98} x2={112} y1={tickY} y2={tickY} strokeWidth={1.5} />
                    <text x={116} y={tickY + 3} className="text-[8px] font-mono fill-ink-soft stroke-none">{val}</text>
                  </g>
                );
              })}
              {[0.9, 0.7, 0.5, 0.3, 0.1].map((frac) => {
                const tickY = CYLINDER_BOTTOM - CYLINDER_RANGE * frac;
                return <line key={frac} x1={104} x2={112} y1={tickY} y2={tickY} strokeWidth={1} />;
              })}
              {[0.95, 0.85, 0.75, 0.65, 0.55, 0.45, 0.35, 0.25, 0.15, 0.05].map((frac) => {
                const tickY = CYLINDER_BOTTOM - CYLINDER_RANGE * frac;
                return <line key={frac} x1={108} x2={112} y1={tickY} y2={tickY} strokeWidth={0.8} opacity={0.6} />;
              })}
              <text x={116} y={22} className="text-[8px] font-mono fill-ink-soft stroke-none">mL</text>
            </g>
          )}

          {/* Glass outline over the liquid for a crisp edge */}
          <path
            d={isFlask ? FLASK_BODY_PATH : CYLINDER_BODY_PATH}
            className="fill-none stroke-ink"
            strokeWidth={2}
            strokeLinejoin="round"
          />

          {/* Top rim / Lip detail */}
          {isFlask ? (
            <g>
              <rect x={68} y={16} width={44} height={10} rx={4} className="fill-lilac stroke-ink" strokeWidth={2} />
              <line x1={68} x2={112} y1={26} y2={26} className="stroke-ink" strokeWidth={1.5} />
            </g>
          ) : (
            <path
              d="M 56 16 L 68 26 L 112 26 L 118 20 L 112 20 L 68 20 Z"
              className="fill-lilac stroke-ink"
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
          )}
        </svg>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mt-6">
        <motion.button
          onClick={() => {
            stopCompletionAlert();
            dispatch(primary.action);
          }}
          whileHover={reduceMotion ? undefined : { scale: 1.03, y: -1 }}
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          style={isRunning ? { backgroundColor: phaseAccent.base } : undefined}
          className={`px-6 py-2.5 rounded-full text-sm font-medium transition-colors duration-500${
            isRunning ? " text-ink" : " bg-ink text-paper hover:opacity-90"
          }`}
        >
          {primary.label}
        </motion.button>
        <motion.button
          onClick={() => {
            stopCompletionAlert();
            dispatch({ type: "RESET" });
          }}
          whileTap={reduceMotion ? undefined : { scale: 0.95 }}
          className="px-5 py-2.5 rounded-full border border-line text-ink-soft text-sm font-medium hover:text-ink hover:border-ink-soft transition-colors duration-200"
        >
          Reset
        </motion.button>
      </div>
    </div>
  );
}




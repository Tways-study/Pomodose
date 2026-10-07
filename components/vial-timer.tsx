"use client";

import { useEffect, useRef, useState, type Dispatch } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FlaskConical, Pause, Play, RotateCcw, TestTube } from "lucide-react";
import type { TimerState } from "@/types";
import type { TimerAction } from "@/lib/timer-machine";
import { startCompletionAlert, stopCompletionAlert } from "@/lib/chime";
import { PHASE_LABEL, formatTime } from "@/lib/timer-format";
import { setRunningTitle, resetTitle } from "@/lib/document-title";
import { primaryAction } from "@/lib/primary-action";
import { useNotify } from "@/components/notification-provider";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { todayKey } from "@/lib/date";
import { SPRING_BOUNCY } from "@/lib/motion";
import { VesselSlot } from "@/components/three/scenes";

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

// Static bubble spots [cx, cy, r] in the lower part of each vessel.
const FLASK_BUBBLES: ReadonlyArray<readonly [number, number, number]> = [
  [62, 182, 6],
  [108, 168, 4],
  [128, 188, 7],
];
const CYLINDER_BUBBLES: ReadonlyArray<readonly [number, number, number]> = [
  [86, 176, 5],
  [98, 150, 4],
  [90, 124, 4],
];

const VESSELS = [
  { id: "flask", label: "Flask", aria: "Switch to Flask view", Icon: FlaskConical },
  { id: "cylinder", label: "Cylinder", aria: "Switch to Graduated Cylinder view", Icon: TestTube },
] as const;

interface Props {
  state: TimerState;
  dispatch: Dispatch<TimerAction>;
}

export function VialTimer({ state, dispatch }: Props) {
  const [vessel, setVessel] = useState<"flask" | "cylinder">("flask");
  // The 3D vessel replaces the SVG one only once it has drawn a frame; until then
  // (and for reduced motion / low-end devices / no WebGL / a failed scene) the SVG stays.
  const [vessel3dReady, setVessel3dReady] = useState(false);
  // Bumped on every completed session so the 3D vessel can splash.
  const [completions, setCompletions] = useState(0);
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
        setCompletions((c) => c + 1);
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

  // Linear and one tick long: the drain is constant motion, so each 1s tick
  // hands off to the next without the surge-and-stall an ease-out produces.
  const liquidTransition = reduceMotion
    ? { duration: 0 }
    : { type: "tween" as const, duration: 1, ease: "linear" as const };

  // --- Primary control label / action (shared with the sticky bar) -----------
  const primary = primaryAction(state);

  function handlePrimary() {
    stopCompletionAlert();
    dispatch(primary.action);
  }

  // Space starts/pauses/resumes. Skipped while the user is typing, on a focused
  // control (which already handles Space natively), or inside a dialog.
  const handlePrimaryRef = useRef(handlePrimary);
  useEffect(() => {
    handlePrimaryRef.current = handlePrimary;
  });
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code !== "Space" || e.repeat || e.defaultPrevented) return;
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      const target = e.target;
      if (
        target instanceof Element &&
        target.closest("input, textarea, select, button, a, [contenteditable], [role='dialog']")
      ) {
        return;
      }
      e.preventDefault();
      handlePrimaryRef.current();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const vesselLabel = `${PHASE_LABEL[state.phase]} timer, ${formatTime(state.remaining)} remaining`;
  const PrimaryIcon = primary.icon === "pause" ? Pause : Play;

  const bubbles = isFlask ? FLASK_BUBBLES : CYLINDER_BUBBLES;
  const glossX = isFlask ? 42 : 74;
  const glossY = isFlask ? 120 : 40;
  const glossH = isFlask ? 66 : 120;
  const bodyPath = isFlask ? FLASK_BODY_PATH : CYLINDER_BODY_PATH;
  // Always present (reduced motion makes it a no-op): framer adds tabindex="0" to any
  // element with a tap gesture, so the prop must not differ between server and client.
  const tapProps = { whileTap: { scale: reduceMotion ? 1 : 0.94 } };

  return (
    <div className="flex flex-col items-center">
      {/* Vessel Shape Selector */}
      <div role="group" aria-label="Vessel shape" className="mb-4 flex items-center gap-2">
        {VESSELS.map(({ id, label, aria, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setVessel(id);
              setVessel3dReady(false);
            }}
            aria-pressed={vessel === id}
            aria-label={aria}
            className={`flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-pill px-4 font-display text-sm font-medium text-ink transition-colors duration-150 ${
              vessel === id ? "bg-gum-lilac shadow-gum" : "bg-surface-2 shadow-gum hover:bg-gum-lilac/40"
            }`}
          >
            <Icon size={16} strokeWidth={2.25} aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {/* Readout: one fixed-width soft cell per character so digits never jitter */}
      <div className="mb-3 flex flex-col items-center">
        <span
          className="digits flex items-center gap-1 text-6xl leading-none text-ink sm:text-7xl"
          aria-hidden
        >
          {formatTime(state.remaining).split("").map((ch, i) => (
            <span
              key={i}
              className={
                ch === ":"
                  ? "inline-flex w-[0.4em] justify-center pb-[0.08em]"
                  : "inline-flex w-[1.05em] justify-center rounded-control bg-surface-2 py-[0.08em]"
              }
            >
              {ch}
            </span>
          ))}
        </span>
        <span className="mt-3 font-display text-base text-ink-soft">
          {PHASE_LABEL[state.phase]}
        </span>
      </div>

      {/* Vessel Graphic */}
      <div className="relative aspect-[180/230] w-[200px]" data-vial-anchor>
        <VesselSlot
          vessel={vessel}
          fraction={clamped}
          running={state.status === "running"}
          splashKey={completions}
          label={vesselLabel}
          onStatus={setVessel3dReady}
        />
        {!vessel3dReady && (
        <svg
          viewBox="0 0 180 230"
          className="h-auto w-[200px]"
          role="img"
          aria-label={vesselLabel}
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          <defs>
            <clipPath id="vessel-clip">
              <path d={bodyPath} />
            </clipPath>
          </defs>

          {/* Base for Cylinder */}
          {!isFlask && (
            <path
              d="M 48 190 L 34 204 L 44 216 L 136 216 L 146 204 L 132 190 Z"
              className="fill-line-soft stroke-line-soft"
              strokeWidth={6}
            />
          )}

          {/* Gummy glass body: lilac tint so empty glass reads on the white card */}
          <path d={bodyPath} className="fill-gum-lilac" fillOpacity={0.25} />

          {/* Liquid + meniscus, constrained to the glass interior */}
          <g clipPath="url(#vessel-clip)">
            {/* Full-height liquid scaled from the bottom: a transform, not a
                per-frame y/height attribute repaint. */}
            <motion.rect
              x={0}
              y={bottomY - range}
              width={180}
              height={range}
              className="fill-dosey-lilac"
              style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
              initial={false}
              animate={{ scaleY: clamped }}
              transition={liquidTransition}
            />
            <motion.ellipse
              cx={90}
              cy={bottomY}
              rx={meniscusRx}
              ry={3.5}
              className="fill-surface"
              initial={false}
              animate={{ y: y - bottomY, opacity: clamped > 0 && clamped < 1 ? 0.45 : 0 }}
              transition={liquidTransition}
            />
            {/* Flat bubbles: static spots, hidden when the level is too low */}
            <motion.g
              className="fill-surface"
              initial={false}
              animate={{ opacity: clamped < 0.3 ? 0 : 0.5 }}
              transition={{ duration: reduceMotion ? 0 : 0.3 }}
            >
              {bubbles.map(([cx, cy, br]) => (
                <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={br} />
              ))}
            </motion.g>
            {/* Soft vertical gloss stripe along the left of the glass */}
            <rect
              x={glossX}
              y={glossY}
              width={7}
              height={glossH}
              rx={3.5}
              className="fill-surface"
              fillOpacity={0.55}
            />
          </g>

          {/* Graduations only on Cylinder (Flask is kept completely clean) */}
          {!isFlask && (
            <g className="stroke-ink-soft">
              {[1.0, 0.8, 0.6, 0.4, 0.2].map((frac) => {
                const tickY = CYLINDER_BOTTOM - CYLINDER_RANGE * frac;
                const val = Math.round(frac * 100);
                return (
                  <g key={frac}>
                    <line x1={98} x2={112} y1={tickY} y2={tickY} strokeWidth={2.5} />
                    <text x={118} y={tickY + 4} fontSize={11} className="fill-ink-soft stroke-none font-display">{val}</text>
                  </g>
                );
              })}
              {[0.9, 0.7, 0.5, 0.3, 0.1].map((frac) => {
                const tickY = CYLINDER_BOTTOM - CYLINDER_RANGE * frac;
                return <line key={frac} x1={104} x2={112} y1={tickY} y2={tickY} strokeWidth={2} />;
              })}
              <text x={118} y={22} fontSize={11} className="fill-ink-soft stroke-none font-display">mL</text>
            </g>
          )}

          {/* Top rim / cap */}
          {isFlask ? (
            <rect x={66} y={14} width={48} height={14} rx={7} className="fill-gum-butter" />
          ) : (
            <path
              d="M 56 16 L 68 26 L 112 26 L 118 20 L 112 20 L 68 20 Z"
              className="fill-gum-butter stroke-gum-butter"
              strokeWidth={4}
            />
          )}
        </svg>
        )}
      </div>

      {/* Controls */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <motion.button
          type="button"
          onClick={handlePrimary}
          {...tapProps}
          transition={SPRING_BOUNCY}
          className="flex min-h-[48px] cursor-pointer items-center gap-2 rounded-pill bg-ink px-6 py-3 font-display text-base font-medium text-surface shadow-pop transition-transform [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-0.5"
        >
          <PrimaryIcon size={18} strokeWidth={2.25} aria-hidden />
          {primary.label}
        </motion.button>
        <motion.button
          type="button"
          onClick={() => {
            stopCompletionAlert();
            dispatch({ type: "RESET" });
          }}
          {...tapProps}
          transition={SPRING_BOUNCY}
          className="flex min-h-[48px] cursor-pointer items-center gap-2 rounded-pill bg-surface-2 px-5 py-3 font-display text-base font-medium text-ink shadow-gum transition-colors duration-150 hover:bg-gum-lilac/40"
        >
          <RotateCcw size={18} strokeWidth={2.25} aria-hidden />
          Reset
        </motion.button>
      </div>
    </div>
  );
}

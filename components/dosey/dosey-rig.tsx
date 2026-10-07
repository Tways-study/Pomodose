"use client";

import { useId, useRef } from "react";
import type { DoseyMood } from "@/lib/dosey-mood";
import { registerPoke } from "@/lib/dosey-motion";
import { DoseyFx } from "@/components/dosey/dosey-fx";
import {
  BLUSH_MIN_SIZE,
  FX_MIN_SIZE,
  IDLE_MIN_SIZE,
  LID_REST,
  MOODS,
  spiralPath,
  type DoseyVariant,
} from "@/components/dosey/rig-config";
import { useDoseyIdle } from "@/components/dosey/use-dosey-idle";
import { useDoseyMoments } from "@/components/dosey/use-dosey-moments";
import { useHoverLean } from "@/components/dosey/use-hover-lean";
import { usePointerEyes } from "@/components/dosey/use-pointer-eyes";

interface DoseyRigProps {
  mood: DoseyMood;
  size?: number;
  interactive?: boolean;
  className?: string;
  /** `dizzy` is true when this poke completes a rapid combo. */
  onPoke?: (dizzy: boolean) => void;
  /** full = whole capsule, face = lilac head + bare sprout, peek = head cropped flat. */
  variant?: DoseyVariant;
  /** Eyes follow the pointer even when not interactive (decorative peek). */
  trackPointer?: boolean;
  /** Chat is streaming: gaze up-right and blink slowly. */
  thinking?: boolean;
}

interface Geometry {
  vbW: number;
  vbH: number;
  eyeY: number;
  eyeDx: number;
  eyeR: number;
  /** Where the mouth is centred, and how much it is scaled up. */
  mouthY: number;
  mouthScale: number;
  cheekY: number;
  cheekDx: number;
  cheekRx: number;
  cheekRy: number;
  /** Ground / crop line used as the transform origin for squash and breathe. */
  origin: string;
}

const GEOMETRY: Record<DoseyVariant, Geometry> = {
  full: {
    vbW: 200, vbH: 250, eyeY: 112, eyeDx: 34.5, eyeR: 5.5,
    mouthY: 130, mouthScale: 1, cheekY: 129, cheekDx: 47, cheekRx: 10, cheekRy: 6.5,
    origin: "100 238",
  },
  peek: {
    vbW: 200, vbH: 160, eyeY: 112, eyeDx: 34.5, eyeR: 5.5,
    mouthY: 130, mouthScale: 1, cheekY: 129, cheekDx: 47, cheekRx: 10, cheekRy: 6.5,
    origin: "100 160",
  },
  face: {
    vbW: 200, vbH: 200, eyeY: 120, eyeDx: 36, eyeR: 9,
    mouthY: 144, mouthScale: 1.6, cheekY: 142, cheekDx: 54, cheekRx: 13, cheekRy: 8,
    origin: "100 192",
  },
};

// The mouth shapes are drawn around (100, 127).
const MOUTH_DRAW_Y = 127;
const MOUTH_STROKE = 4.5;

/** Plump round-ended leaf: an ellipse rotated by `deg`, baked into a path (no transform attr). */
function leafPath(cx: number, cy: number, a: number, b: number, deg: number): string {
  const t = (deg * Math.PI) / 180;
  const dx = a * Math.cos(t);
  const dy = a * Math.sin(t);
  const x1 = (cx - dx).toFixed(2);
  const y1 = (cy - dy).toFixed(2);
  const x2 = (cx + dx).toFixed(2);
  const y2 = (cy + dy).toFixed(2);
  return `M${x1} ${y1} A${a} ${b} ${deg} 1 0 ${x2} ${y2} A${a} ${b} ${deg} 1 0 ${x1} ${y1} Z`;
}

// Sprout shapes: two leaves + one tomato. The face variant scales them up.
const SPROUT = {
  full: {
    left: leafPath(74, 46, 26, 14, 22),
    right: leafPath(126, 46, 26, 14, -22),
    tomato: { cx: 100, cy: 45, r: 16 },
  },
  face: {
    left: leafPath(66, 40, 33, 18, 20),
    right: leafPath(134, 40, 33, 18, -20),
    tomato: { cx: 100, cy: 44, r: 21 },
  },
} as const;

export function DoseyRig({
  mood,
  size = 160,
  interactive = false,
  className,
  onPoke,
  variant,
  trackPointer = false,
  thinking = false,
}: DoseyRigProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const leftPupil = useRef<SVGCircleElement>(null);
  const rightPupil = useRef<SVGCircleElement>(null);
  const pokeHistory = useRef<number[]>([]);
  const clipId = `dosey-clip-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  const kind: DoseyVariant = variant ?? (size < IDLE_MIN_SIZE ? "face" : "full");
  const g = GEOMETRY[kind];
  const sprout = kind === "face" ? SPROUT.face : SPROUT.full;
  const showBlush = size >= BLUSH_MIN_SIZE;
  const showFx = (kind === "full" || kind === "peek") && size >= FX_MIN_SIZE;
  const origin = g.origin;
  const lidRest = LID_REST[mood];

  // A focused peek stays quiet: no pointer tracking to pull attention.
  const eyesFollow =
    (interactive || trackPointer) && size >= IDLE_MIN_SIZE && !(kind === "peek" && mood === "focused");
  usePointerEyes(svgRef, leftPupil, rightPupil, eyesFollow, g.eyeY / g.vbH);

  const { deepAsleepRef } = useDoseyIdle({
    scope: svgRef,
    mood,
    size,
    kind,
    origin,
    lidRest,
    thinking,
    fx: showFx,
  });
  const moments = useDoseyMoments({ scope: svgRef, mood, kind, origin, lidRest, deepAsleepRef });
  useHoverLean(svgRef, buttonRef, interactive && size >= IDLE_MIN_SIZE, origin, g.eyeR);

  const handlePoke = () => {
    const result = registerPoke(pokeHistory.current, Date.now());
    pokeHistory.current = result.history;
    moments.poke(result.dizzy);
    onPoke?.(result.dizzy);
  };

  const leftX = 100 - g.eyeDx;
  const rightX = 100 + g.eyeDx;
  const lid = g.eyeR + 3;

  // Body silhouettes (all upright, no outline).
  const domePath = "M30 150 V125 A70 70 0 0 1 170 125 V150 Z";
  const bottomPath = "M30 150 H170 V165 A70 70 0 0 1 30 165 Z";
  const peekPath = "M30 160 V125 A70 70 0 0 1 170 125 V160 Z";
  const headPath = "M22 122 A78 70 0 0 1 178 122 A78 70 0 0 1 22 122 Z";
  const clipPath =
    kind === "full" ? "M30 125 A70 70 0 0 1 170 125 V165 A70 70 0 0 1 30 165 Z" : kind === "peek" ? peekPath : headPath;

  const svg = (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${g.vbW} ${g.vbH}`}
      width={size}
      height={(size * g.vbH) / g.vbW}
      aria-hidden="true"
      focusable="false"
      className={interactive ? undefined : className}
      style={{ overflow: "visible" }}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={clipPath} />
        </clipPath>
      </defs>

      {kind === "full" && (
        <ellipse data-dosey="shadow" cx="100" cy="242" rx="52" ry="6" className="fill-ink" opacity="0.1" />
      )}

      <g data-rig="lean">
      <g data-rig="squash">
        <g data-rig="react">
        <g data-rig="move">
          <g data-dosey="body">
            {/* sprout: two plump leaves + one tomato */}
            <g data-dosey="sprout">
              <g data-rig="sway">
                <g data-rig="perk">
                  <g data-dosey="leaves">
                    <path d={sprout.left} className="fill-dosey-sprout" />
                    <path d={sprout.right} className="fill-dosey-sprout" />
                  </g>
                  <g data-dosey="tomatoes">
                    <circle
                      cx={sprout.tomato.cx}
                      cy={sprout.tomato.cy}
                      r={sprout.tomato.r}
                      className="fill-dosey-tomato"
                    />
                  </g>
                </g>
              </g>
            </g>

            {/* capsule */}
            {kind === "full" && (
              <>
                <path d={domePath} className="fill-dosey-lilac" />
                <path d={bottomPath} className="fill-dosey-cream" />
              </>
            )}
            {kind === "peek" && <path d={peekPath} className="fill-dosey-lilac" />}
            {kind === "face" && <path d={headPath} className="fill-dosey-lilac" />}

            {/* barely-there depth */}
            <g clipPath={`url(#${clipId})`}>
              <ellipse cx="78" cy={kind === "face" ? 88 : 82} rx="36" ry="13" className="fill-surface" opacity="0.18" />
              {kind === "full" && (
                <ellipse cx="100" cy="236" rx="80" ry="24" className="fill-ink" opacity="0.06" />
              )}
            </g>

            {/* face */}
            <g data-dosey="face">
              <g>
                <g data-rig="gaze">
                  <circle ref={leftPupil} data-rig="pupil" cx={leftX} cy={g.eyeY} r={g.eyeR} className="fill-ink" />
                  <path
                    data-rig="spiral"
                    d={spiralPath(leftX, g.eyeY, g.eyeR)}
                    className="fill-none stroke-ink"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    style={{ opacity: 0 }}
                  />
                </g>
                <rect
                  data-rig="lid"
                  x={leftX - lid}
                  y={g.eyeY - lid}
                  width={lid * 2}
                  height={lid * 2}
                  className="fill-dosey-lilac"
                  style={{ opacity: 0 }}
                />
              </g>
              <g>
                <g data-rig="gaze">
                  <circle ref={rightPupil} data-rig="pupil" cx={rightX} cy={g.eyeY} r={g.eyeR} className="fill-ink" />
                  <path
                    data-rig="spiral"
                    d={spiralPath(rightX, g.eyeY, g.eyeR)}
                    className="fill-none stroke-ink"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    style={{ opacity: 0 }}
                  />
                </g>
                <rect
                  data-rig="lid"
                  x={rightX - lid}
                  y={g.eyeY - lid}
                  width={lid * 2}
                  height={lid * 2}
                  className="fill-dosey-lilac"
                  style={{ opacity: 0 }}
                />
              </g>

              {showBlush && (
                <>
                  <ellipse
                    cx={100 - g.cheekDx}
                    cy={g.cheekY}
                    rx={g.cheekRx}
                    ry={g.cheekRy}
                    data-rig="blush"
                    className="fill-dosey-blush transition-opacity duration-200 motion-reduce:transition-none"
                    style={{ opacity: mood === "proud" ? 0.85 : 0.6 }}
                  />
                  <ellipse
                    cx={100 + g.cheekDx}
                    cy={g.cheekY}
                    rx={g.cheekRx}
                    ry={g.cheekRy}
                    data-rig="blush"
                    className="fill-dosey-blush transition-opacity duration-200 motion-reduce:transition-none"
                    style={{ opacity: mood === "proud" ? 0.85 : 0.6 }}
                  />
                </>
              )}

              <g transform={`translate(100 ${g.mouthY}) scale(${g.mouthScale}) translate(-100 ${-MOUTH_DRAW_Y})`}>
                {MOODS.map((m) => (
                  <g
                    key={m}
                    data-mouth={m}
                    className="transition-opacity duration-200 motion-reduce:transition-none"
                    style={{ opacity: mood === m ? 1 : 0 }}
                  >
                    {m === "sleepy" && (
                      <ellipse
                        cx="100"
                        cy="128"
                        rx="3.5"
                        ry="3"
                        className="fill-none stroke-ink"
                        strokeWidth={MOUTH_STROKE}
                      />
                    )}
                    {m === "focused" && (
                      <path
                        d="M93 128 H107"
                        className="fill-none stroke-ink"
                        strokeWidth={MOUTH_STROKE}
                        strokeLinecap="round"
                      />
                    )}
                    {m === "relaxed" && (
                      <path
                        d="M91 125 Q100 134 109 125"
                        className="fill-none stroke-ink"
                        strokeWidth={MOUTH_STROKE}
                        strokeLinecap="round"
                      />
                    )}
                    {m === "waiting" && (
                      <path
                        d="M93 129 L107 126"
                        className="fill-none stroke-ink"
                        strokeWidth={MOUTH_STROKE}
                        strokeLinecap="round"
                      />
                    )}
                    {m === "proud" && (
                      <path
                        d="M89 123 Q100 142 111 123 Z"
                        className="fill-ink stroke-ink"
                        strokeWidth={MOUTH_STROKE}
                        strokeLinejoin="round"
                      />
                    )}
                  </g>
                ))}
              </g>
            </g>
          </g>
        </g>
        </g>
      </g>
      </g>

      {showFx && <DoseyFx />}
    </svg>
  );

  if (!interactive) return svg;

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label="Poke Dosey"
      onClick={handlePoke}
      className={`inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-pill ${className ?? ""}`}
    >
      {svg}
    </button>
  );
}

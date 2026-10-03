"use client";

import { useId, useRef } from "react";
import { gsap, useGSAP, withMotion } from "@/lib/gsap";
import type { DoseyMood } from "@/lib/dosey-mood";
import { usePointerEyes } from "@/components/dosey/use-pointer-eyes";

export type DoseyVariant = "full" | "face" | "peek";

interface DoseyRigProps {
  mood: DoseyMood;
  size?: number;
  interactive?: boolean;
  className?: string;
  onPoke?: () => void;
  /** full = whole capsule, face = lilac head + bare sprout, peek = head cropped flat. */
  variant?: DoseyVariant;
  /** Eyes follow the pointer even when not interactive (decorative peek). */
  trackPointer?: boolean;
}

// Eyelid scaleY at rest per mood (0 = open, 1 = shut).
const LID_REST: Record<DoseyMood, number> = {
  sleepy: 0.55,
  focused: 0.25,
  relaxed: 0,
  proud: 0,
};

// Below this size no idle GSAP loops run (static pose). Below BLUSH_MIN_SIZE
// the cheeks are dropped so the mark stays legible.
const IDLE_MIN_SIZE = 40;
const BLUSH_MIN_SIZE = 28;

const MOODS: DoseyMood[] = ["sleepy", "focused", "relaxed", "proud"];

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

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function DoseyRig({
  mood,
  size = 160,
  interactive = false,
  className,
  onPoke,
  variant,
  trackPointer = false,
}: DoseyRigProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const leftPupil = useRef<SVGCircleElement>(null);
  const rightPupil = useRef<SVGCircleElement>(null);
  const clipId = `dosey-clip-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  const kind: DoseyVariant = variant ?? (size < IDLE_MIN_SIZE ? "face" : "full");
  const g = GEOMETRY[kind];
  const sprout = kind === "face" ? SPROUT.face : SPROUT.full;
  const showBlush = size >= BLUSH_MIN_SIZE;
  const origin = g.origin;

  usePointerEyes(
    svgRef,
    leftPupil,
    rightPupil,
    (interactive || trackPointer) && size >= IDLE_MIN_SIZE,
    g.eyeY / g.vbH,
  );

  // Mood-driven motion. Re-runs (and reverts) on every mood change.
  useGSAP(
    () => {
      const lids = gsap.utils.toArray<SVGElement>('[data-rig="lid"]');
      const move = '[data-rig="move"]';
      const sway = '[data-rig="sway"]';
      const rest = LID_REST[mood];

      // Static pose first: reduced-motion users get exactly this.
      gsap.set(lids, { opacity: 1, scaleY: rest, transformOrigin: "50% 0%" });

      // Small marks (FAB, chat header) stay a static pose: no infinite loops.
      if (size < IDLE_MIN_SIZE) return;

      const mm = withMotion(() => {
        let blinkCall: gsap.core.Tween | null = null;
        const scheduleBlink = () => {
          blinkCall = gsap.delayedCall(3 + Math.random() * 2, () => {
            gsap
              .timeline({ onComplete: scheduleBlink })
              .to(lids, { scaleY: 1, duration: 0.07, ease: "power1.in" })
              .to(lids, { scaleY: rest, duration: 0.14, ease: "power1.out" });
          });
        };
        scheduleBlink();

        if (mood === "sleepy") {
          gsap.to(move, {
            scale: 1.02,
            svgOrigin: origin,
            duration: 4,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
        }

        if (mood === "proud") {
          if (kind === "peek") {
            // Head is pinned to the card edge: stretch up instead of hopping (no gap).
            gsap
              .timeline()
              .to(move, { scaleY: 1.1, svgOrigin: origin, duration: 0.22, ease: "power2.out" })
              .to(move, { scaleY: 1, duration: 0.6, ease: "back.out(3)" });
          } else {
            gsap
              .timeline()
              .to(move, { y: -14, duration: 0.22, ease: "power2.out" })
              .to(move, { y: 0, duration: 0.6, ease: "back.out(3)" });
          }
          gsap.fromTo(
            sway,
            { rotation: -9, transformOrigin: "50% 100%" },
            { rotation: 0, duration: 1, ease: "elastic.out(1, 0.25)" },
          );
        }

        return () => {
          blinkCall?.kill();
        };
      });

      return () => mm.revert();
    },
    { scope: svgRef, dependencies: [mood, size, kind], revertOnUpdate: true },
  );

  const { contextSafe } = useGSAP({ scope: svgRef });

  const poke = contextSafe(() => {
    if (!prefersReducedMotion()) {
      const squash = '[data-rig="squash"]';
      gsap.killTweensOf(squash);
      gsap
        .timeline()
        .to(squash, {
          scaleY: 0.82,
          scaleX: 1.12,
          svgOrigin: origin,
          duration: 0.1,
          ease: "power2.out",
        })
        .to(squash, {
          scaleY: 1,
          scaleX: 1,
          duration: 0.9,
          ease: "elastic.out(1, 0.4)",
        });
      // Impulse from the current angle (not a fixed -12°) so rapid pokes
      // retarget smoothly instead of snapping back to the start pose.
      const sway = '[data-rig="sway"]';
      gsap.killTweensOf(sway);
      gsap
        .timeline()
        .to(sway, { rotation: "-=12", transformOrigin: "50% 100%", duration: 0.1, ease: "power2.out" })
        .to(sway, { rotation: 0, duration: 1.1, ease: "elastic.out(1, 0.2)" });
    }
    onPoke?.();
  });

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

      <g data-rig="squash">
        <g data-rig="move">
          <g data-dosey="body">
            {/* sprout: two plump leaves + one tomato */}
            <g data-dosey="sprout">
              <g data-rig="sway">
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
                <circle ref={leftPupil} cx={leftX} cy={g.eyeY} r={g.eyeR} className="fill-ink" />
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
                <circle ref={rightPupil} cx={rightX} cy={g.eyeY} r={g.eyeR} className="fill-ink" />
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
                    className="fill-dosey-blush transition-opacity duration-200 motion-reduce:transition-none"
                    style={{ opacity: mood === "proud" ? 0.85 : 0.6 }}
                  />
                  <ellipse
                    cx={100 + g.cheekDx}
                    cy={g.cheekY}
                    rx={g.cheekRx}
                    ry={g.cheekRy}
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
    </svg>
  );

  if (!interactive) return svg;

  return (
    <button
      type="button"
      aria-label="Poke Dosey"
      onClick={poke}
      className={`inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-pill ${className ?? ""}`}
    >
      {svg}
    </button>
  );
}

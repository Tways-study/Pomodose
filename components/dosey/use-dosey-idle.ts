"use client";

import { useRef, type RefObject } from "react";
import { gsap, useGSAP, withMotion, type ContextSafe } from "@/lib/gsap";
import type { DoseyMood } from "@/lib/dosey-mood";
import { DOSEY_TIMING, pickInRange } from "@/lib/dosey-motion";
import { SETTINGS } from "@/lib/settings";
import {
  buildBreezePuff,
  buildSparkleBurst,
  buildZzz,
} from "@/components/dosey/dosey-fx-timelines";
import {
  DEEP_SLEEP_LID,
  IDLE_MIN_SIZE,
  THINKING_GAZE,
  type DoseyVariant,
} from "@/components/dosey/rig-config";
import { getRigParts } from "@/components/dosey/rig-parts";

interface IdleParams {
  scope: RefObject<SVGSVGElement | null>;
  mood: DoseyMood;
  size: number;
  kind: DoseyVariant;
  /** Ground / crop line used as the transform origin for breathe and sway. */
  origin: string;
  /** Eyelid scaleY at rest for this mood. */
  lidRest: number;
  /** Chat is streaming: gaze up-right, slower blinks. */
  thinking: boolean;
  /** Render/animate the decorative fx (full/peek at size >= FX_MIN_SIZE). */
  fx: boolean;
}

type Anim = gsap.core.Animation;
type Range = readonly [number, number];

const GLANCE = 2.5;

/** A repeating one-shot: waits a random delay, plays, repeats. Pausable. */
function createLooper(safe: ContextSafe, range: () => Range, play: () => Anim | null) {
  const safePlay = safe(play);
  let running = false;
  let call: gsap.core.Tween | null = null;
  let current: Anim | null = null;

  const schedule = () => {
    call = gsap.delayedCall(
      pickInRange(range()),
      safe(() => {
        call = null;
        current = safePlay();
        if (current) {
          current.eventCallback("onComplete", () => {
            current = null;
            if (running) schedule();
          });
        } else if (running) {
          schedule();
        }
      }),
    );
  };

  return {
    start() {
      if (running) return;
      running = true;
      // A one-shot still finishing will reschedule itself.
      if (!current) schedule();
    },
    stop() {
      running = false;
      call?.kill();
      call = null;
    },
  };
}

/**
 * Per-mood idle behavior: blink, breathe and the calm loops. Re-runs (and
 * reverts) on every mood change. The loops only run while the rig is on
 * screen. Reduced-motion users get just the static lid pose. Exposes
 * `deepAsleepRef` so the moment hook can pick wake vs startle (it clears it).
 */
export function useDoseyIdle({
  scope,
  mood,
  size,
  kind,
  origin,
  lidRest,
  thinking,
  fx,
}: IdleParams): { deepAsleepRef: RefObject<boolean> } {
  const deepAsleepRef = useRef(false);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      const p = getRigParts(root);
      // Entering sleepy always starts awake; the moment hook clears the flag on leaving it.
      if (mood === "sleepy") deepAsleepRef.current = false;

      // Static pose first: reduced-motion users get exactly this.
      gsap.set(p.lids, { opacity: 1, scaleY: lidRest, transformOrigin: "50% 0%" });

      const mm = withMotion((safe) => {
        const loops = size >= IDLE_MIN_SIZE;
        const useFx = loops && fx;
        let rest = lidRest;
        let active = true;

        const loopers: ReturnType<typeof createLooper>[] = [];
        // Infinite animations that pause offscreen. Held by name so a swap
        // (deep sleep) replaces the right one.
        const loopAnims: { breathe: Anim | null; zzz: Anim | null; others: Anim[] } = {
          breathe: null,
          zzz: null,
          others: [],
        };

        const track = <T extends Anim>(anim: T): T => {
          if (!active) anim.pause();
          return anim;
        };

        // Blink (all sizes). Slower while thinking, skipped in deep sleep.
        const blinkRange = (): Range =>
          thinking ? DOSEY_TIMING.thinkingBlinkS : DOSEY_TIMING.blinkS[mood];
        loopers.push(
          createLooper(safe, blinkRange, () => {
            if (deepAsleepRef.current) return null;
            return gsap
              .timeline()
              .to(p.lids, { scaleY: 1, duration: 0.07, ease: "power1.in" })
              .to(p.lids, { scaleY: rest, duration: 0.14, ease: "power1.out" });
          }),
        );

        // Thinking gaze (all sizes): up and to the right.
        if (thinking) {
          const off = THINKING_GAZE[kind];
          gsap.to(p.gaze, { x: off, y: -off, duration: 0.4, ease: "power2.out" });
        }

        if (loops) {
          const breathe = (scale: number, durationS: number) =>
            track(
              gsap.to(p.move, {
                scale,
                svgOrigin: origin,
                duration: durationS,
                ease: "sine.inOut",
                yoyo: true,
                repeat: -1,
              }),
            );

          if (mood === "sleepy") {
            const b = DOSEY_TIMING.breathe.sleepy;
            loopAnims.breathe = breathe(b.scale, b.durationS);

            loopers.push(
              createLooper(
                safe,
                () => DOSEY_TIMING.nodIntervalS,
                () =>
                  gsap
                    .timeline()
                    .to(p.move, { rotation: 4, svgOrigin: origin, duration: 0.7, ease: "sine.inOut" })
                    .to(p.move, { rotation: 0, duration: 0.8, ease: "sine.inOut" }),
              ),
            );

            if (useFx) loopAnims.zzz = track(buildZzz(p.zs, false));

            const enterDeep = safe(() => {
              deepAsleepRef.current = true;
              rest = DEEP_SLEEP_LID;
              gsap.to(p.lids, { scaleY: DEEP_SLEEP_LID, duration: 0.8, ease: "power1.inOut", overwrite: "auto" });
              // Peek is pinned to the card edge: no droop in y.
              if (kind !== "peek") gsap.to(p.move, { y: 2, duration: 1.2, ease: "sine.inOut" });
              loopAnims.breathe?.kill();
              const deep = DOSEY_TIMING.breathe.deepSleep;
              loopAnims.breathe = breathe(deep.scale, deep.durationS);
              if (useFx) {
                loopAnims.zzz?.kill();
                p.zs.forEach((z) => gsap.set(z, { opacity: 0 }));
                loopAnims.zzz = track(buildZzz(p.zs, true));
              }
            });
            gsap.delayedCall(SETTINGS.DOSEY_DEEP_SLEEP_SECONDS, enterDeep);
          }

          if (mood === "focused") {
            const b = DOSEY_TIMING.breathe.focused;
            loopAnims.breathe = breathe(b.scale, b.durationS);
            if (!thinking) {
              loopers.push(
                createLooper(
                  safe,
                  () => DOSEY_TIMING.glanceDownIntervalS,
                  () =>
                    gsap
                      .timeline()
                      .to(p.gaze, { y: 2, duration: 0.3, ease: "power2.out" })
                      .to(p.gaze, { y: 0, duration: 0.4, ease: "power2.inOut" }, "+=0.9"),
                ),
              );
            }
          }

          if (mood === "relaxed") {
            const seg = DOSEY_TIMING.swaySegmentS;
            loopAnims.others.push(
              track(
                gsap
                  .timeline({ repeat: -1 })
                  .to(p.move, { rotation: 2.5, svgOrigin: origin, duration: seg, ease: "sine.out" })
                  .to(p.move, { rotation: 0, duration: seg, ease: "sine.in" })
                  .to(p.move, { rotation: -2.5, duration: seg, ease: "sine.out" })
                  .to(p.move, { rotation: 0, duration: seg, ease: "sine.in" }),
              ),
            );
            loopAnims.others.push(
              track(
                gsap.fromTo(
                  p.sway,
                  { rotation: -3, transformOrigin: "50% 100%" },
                  {
                    rotation: 3,
                    duration: DOSEY_TIMING.leafFlutterS,
                    ease: "sine.inOut",
                    yoyo: true,
                    repeat: -1,
                  },
                ),
              ),
            );
            loopers.push(
              createLooper(
                safe,
                () => DOSEY_TIMING.squintIntervalS,
                () =>
                  gsap
                    .timeline()
                    .to(p.lids, { scaleY: 0.4, duration: 0.25, ease: "power2.out" }, 0)
                    .to(p.blush, { opacity: 0.9, duration: 0.25 }, 0)
                    .to(p.lids, { scaleY: rest, duration: 0.3, ease: "power2.inOut" }, 1.05)
                    .to(p.blush, { opacity: 0.6, duration: 0.3 }, 1.05),
              ),
            );
            if (useFx) {
              loopers.push(
                createLooper(
                  safe,
                  () => DOSEY_TIMING.breezeIntervalS,
                  () => buildBreezePuff(p.breezes),
                ),
              );
            }
          }

          if (mood === "waiting") {
            loopers.push(
              createLooper(
                safe,
                () => DOSEY_TIMING.glanceWaitingIntervalS,
                () =>
                  gsap
                    .timeline()
                    .to(p.move, { rotation: 3, svgOrigin: origin, duration: 0.5, ease: "sine.inOut" }, 0)
                    .to(p.gaze, { x: -GLANCE, duration: 0.25, ease: "power2.out" }, 0)
                    .to(p.gaze, { x: GLANCE, duration: 0.3, ease: "power2.inOut" }, 0.85)
                    .to(p.gaze, { x: 0, duration: 0.3, ease: "power2.out" }, 1.6)
                    .to(p.move, { rotation: 0, duration: 0.6, ease: "sine.inOut" }, 1.5),
              ),
            );
          }

          if (mood === "proud" && useFx) {
            buildSparkleBurst(p.sparkles);
          }
        }

        const setActive = (next: boolean) => {
          active = next;
          const anims = [loopAnims.breathe, loopAnims.zzz, ...loopAnims.others];
          for (const a of anims) a?.paused(!next);
          for (const l of loopers) {
            if (next) l.start();
            else l.stop();
          }
        };

        // Offscreen rigs (Meet Dosey sits below the fold) must not keep writing
        // transforms. Hidden tabs need no handling: browsers suspend rAF there.
        for (const l of loopers) l.start();
        const observer =
          typeof IntersectionObserver !== "undefined"
            ? new IntersectionObserver(([entry]) => setActive(entry.isIntersecting))
            : null;
        observer?.observe(root);

        return () => {
          observer?.disconnect();
          for (const l of loopers) l.stop();
        };
      });

      return () => mm.revert();
    },
    { scope, dependencies: [mood, size, kind, origin, lidRest, thinking, fx], revertOnUpdate: true },
  );

  return { deepAsleepRef };
}

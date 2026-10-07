"use client";

import { useEffect, type RefObject } from "react";
import { gsap, withMotion } from "@/lib/gsap";
import { getRigParts } from "@/components/dosey/rig-parts";

const MAX_LEAN_DEG = 6;
const PERK_SCALE = 1.03;
const PUPIL_GROW = 1.15;

/**
 * Hover lean for interactive rigs: the pointer's horizontal position over the
 * trigger leans Dosey up to +-6 degrees, and entering perks it up (taller,
 * wider pupils). Fine pointers only; withMotion gates reduced motion. Owns the
 * `lean` group and the pupils' radius (their x/y belong to use-pointer-eyes).
 */
export function useHoverLean(
  scope: RefObject<SVGSVGElement | null>,
  trigger: RefObject<HTMLElement | null>,
  enabled: boolean,
  origin: string,
  eyeR: number,
): void {
  useEffect(() => {
    const root = scope.current;
    const el = trigger.current;
    if (!enabled || !root || !el) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const mm = withMotion(() => {
      const { lean, pupils } = getRigParts(root);
      gsap.set(lean, { svgOrigin: origin });
      const leanTo = gsap.quickTo(lean, "rotation", { duration: 0.4, ease: "power3.out" });

      const onEnter = () => {
        gsap.to(lean, { scaleY: PERK_SCALE, duration: 0.25, ease: "power2.out", overwrite: "auto" });
        gsap.to(pupils, { attr: { r: eyeR * PUPIL_GROW }, duration: 0.25, ease: "power2.out" });
      };
      const onMove = (e: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        const t = (e.clientX - rect.left) / rect.width - 0.5;
        leanTo(Math.max(-0.5, Math.min(0.5, t)) * 2 * MAX_LEAN_DEG);
      };
      const onLeave = () => {
        leanTo(0);
        gsap.to(lean, { scaleY: 1, duration: 0.8, ease: "elastic.out(1, 0.5)", overwrite: "auto" });
        gsap.to(pupils, { attr: { r: eyeR }, duration: 0.3, ease: "power2.out" });
      };

      el.addEventListener("pointerenter", onEnter);
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
      return () => {
        el.removeEventListener("pointerenter", onEnter);
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
      };
    });

    return () => mm.revert();
  }, [scope, trigger, enabled, origin, eyeR]);
}

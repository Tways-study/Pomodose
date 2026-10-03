"use client";

import { useEffect, type RefObject } from "react";
import { gsap } from "@/lib/gsap";

const MAX_OFFSET = 3; // SVG units

/**
 * Drives two pupil elements to follow the pointer. Fine pointers only, no
 * reduced motion. `eyeRatio` is how far down the root box the eyes sit (0-1).
 */
export function usePointerEyes(
  rootRef: RefObject<Element | null>,
  leftPupilRef: RefObject<SVGElement | null>,
  rightPupilRef: RefObject<SVGElement | null>,
  enabled: boolean,
  eyeRatio = 0.4,
): void {
  useEffect(() => {
    if (!enabled) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = rootRef.current;
    const left = leftPupilRef.current;
    const right = rightPupilRef.current;
    if (!fine || reduced || !root || !left || !right) return;

    const opts = { duration: 0.35, ease: "power3.out" } as const;
    const lx = gsap.quickTo(left, "x", opts);
    const ly = gsap.quickTo(left, "y", opts);
    const rx = gsap.quickTo(right, "x", opts);
    const ry = gsap.quickTo(right, "y", opts);

    let frame = 0;
    let px = 0;
    let py = 0;

    const apply = () => {
      frame = 0;
      const rect = root.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height * eyeRatio;
      const dx = px - cx;
      const dy = py - cy;
      const dist = Math.hypot(dx, dy);
      const scale = dist === 0 ? 0 : Math.min(MAX_OFFSET, dist / 40) / dist;
      const x = dx * scale;
      const y = dy * scale;
      lx(x);
      ly(y);
      rx(x);
      ry(y);
    };

    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!frame) frame = window.requestAnimationFrame(apply);
    };

    const recenter = () => {
      lx(0);
      ly(0);
      rx(0);
      ry(0);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", recenter);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", recenter);
      if (frame) window.cancelAnimationFrame(frame);
      gsap.killTweensOf([left, right]);
      gsap.set([left, right], { x: 0, y: 0 });
    };
  }, [rootRef, leftPupilRef, rightPupilRef, enabled, eyeRatio]);
}

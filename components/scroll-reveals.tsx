"use client";

import { useEffect, type RefObject } from "react";
import { gsap, ScrollTrigger, useGSAP, withMotion } from "@/lib/gsap";
import { GSAP_EASE_OUT, REVEAL } from "@/lib/motion";

interface ScrollRevealsProps {
  scopeRef: RefObject<HTMLElement | null>;
  /** Changing this recalculates trigger positions (e.g. when content height changes). */
  refreshKey?: number | string;
}

// One-shot reveal per `[data-reveal]` section, staggering any
// `[data-reveal-item]` children. Hidden states are only ever set inside
// withMotion (via gsap.from), so content is visible with reduced motion or
// before JS. `data-reveal="none"` opts a section out (it owns its timeline).
export function ScrollReveals({ scopeRef, refreshKey }: ScrollRevealsProps) {
  useGSAP(
    () => {
      const mm = withMotion(() => {
        const sections = gsap.utils.toArray<HTMLElement>("[data-reveal]");
        for (const section of sections) {
          if (section.dataset.reveal === "none") continue;
          // One moving layer per section: the items when it has them, else the
          // section itself — never both, so the motion doesn't compound.
          const items = section.querySelectorAll<HTMLElement>("[data-reveal-item]");
          gsap.from(items.length > 0 ? items : section, {
            y: REVEAL.y,
            autoAlpha: 0,
            duration: REVEAL.duration,
            ease: GSAP_EASE_OUT,
            stagger: REVEAL.stagger,
            scrollTrigger: { trigger: section, start: "top 88%", once: true },
          });
        }
        return () => undefined;
      });
      return () => mm.revert();
    },
    { scope: scopeRef },
  );

  useEffect(() => {
    ScrollTrigger.refresh();
  }, [refreshKey]);

  return null;
}

import { gsap } from "@/lib/gsap";
import { DOSEY_TIMING } from "@/lib/dosey-motion";

/** Rising "z" glyphs, looped. `deep` is the bigger, slower deep-sleep version. */
export function buildZzz(zs: SVGElement[], deep: boolean): gsap.core.Timeline {
  const cycle = deep ? DOSEY_TIMING.deepZzzCycleS : DOSEY_TIMING.zzzCycleS;
  const stagger = deep ? DOSEY_TIMING.zzzStaggerS * 1.5 : DOSEY_TIMING.zzzStaggerS;
  const tl = gsap.timeline({ repeat: -1 });
  zs.forEach((z, i) => {
    const at = i * stagger;
    tl.fromTo(
      z,
      { x: 0, y: 0, scale: 0.6, opacity: 0 },
      { x: deep ? 16 : 10, y: deep ? -34 : -26, scale: deep ? 1.25 : 1, duration: cycle, ease: "none" },
      at,
    )
      .to(z, { opacity: deep ? 0.9 : 0.75, duration: cycle * 0.25, ease: "power1.out" }, at)
      .to(z, { opacity: 0, duration: cycle * 0.4, ease: "power1.in" }, at + cycle * 0.6);
  });
  return tl;
}

/** One burst of four-point sparkles (proud). */
export function buildSparkleBurst(sparkles: SVGElement[]): gsap.core.Timeline {
  const tl = gsap.timeline();
  sparkles.forEach((s, i) => {
    const at = i * 0.08;
    tl.fromTo(
      s,
      { scale: 0, opacity: 0, rotation: 0 },
      { scale: 1, opacity: 1, rotation: 45, duration: 0.35, ease: "back.out(2)" },
      at,
    ).to(s, { opacity: 0, scale: 0.4, duration: 0.5, ease: "power1.in" }, at + 0.55);
  });
  return tl;
}

/** A single drifting breeze puff across the arcs (relaxed). */
export function buildBreezePuff(breezes: SVGElement[]): gsap.core.Timeline {
  const tl = gsap.timeline();
  breezes.forEach((b, i) => {
    const at = i * 0.25;
    tl.fromTo(b, { x: -6, opacity: 0 }, { x: 12, duration: 1.4, ease: "sine.inOut" }, at)
      .to(b, { opacity: 0.7, duration: 0.4, ease: "power1.out" }, at)
      .to(b, { opacity: 0, duration: 0.6, ease: "power1.in" }, at + 0.8);
  });
  return tl;
}

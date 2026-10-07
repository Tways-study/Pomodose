import { gsap } from "@/lib/gsap";
import type { DoseyMoment } from "@/lib/dosey-motion";
import type { DoseyVariant } from "@/components/dosey/rig-config";
import type { RigParts } from "@/components/dosey/rig-parts";

/** Everything a timeline builder needs. Call builders inside a gsap context. */
export interface TimelineEnv {
  parts: RigParts;
  /** The sleepy mouth, scaled up for the yawn. */
  sleepyMouth: SVGElement[];
  kind: DoseyVariant;
  /** Ground / crop line used as the transform origin. */
  origin: string;
}

const LEAF_ORIGIN = "50% 100%";

/** Returns the react group (and dizzy eyes) to rest, e.g. after an interrupted timeline. */
export function neutralize(env: TimelineEnv): void {
  const { react, pupils, spirals } = env.parts;
  gsap.set(react, { x: 0, y: 0, rotation: 0, scale: 1 });
  gsap.set(pupils, { opacity: 1 });
  gsap.set(spirals, { opacity: 0, rotation: 0 });
}

/**
 * A vertical move that never translates the pinned peek variant: peek stretches
 * (scaleY from the crop line) instead of moving in y.
 */
function lift(env: TimelineEnv, y: number, peekScale: number): gsap.TweenVars {
  return env.kind === "peek" ? { scaleY: peekScale, svgOrigin: env.origin } : { y };
}

/** The matching return-to-rest vars for `lift`. */
function settle(env: TimelineEnv): gsap.TweenVars {
  return env.kind === "peek" ? { scaleY: 1 } : { y: 0 };
}

/** Finite (< ~900 ms) reaction to a mood change. `prevRest`/`rest` are lid scaleY values. */
export function buildMoment(
  moment: DoseyMoment,
  env: TimelineEnv,
  prevRest: number,
  rest: number,
): gsap.core.Timeline {
  const { react, perk, lids } = env.parts;
  const tl = gsap.timeline();

  switch (moment) {
    case "wake":
      tl.fromTo(lids, { scaleY: 1 }, { scaleY: rest, duration: 0.3, ease: "power2.out", overwrite: "auto" }, 0)
        .to(react, { scaleY: 1.08, svgOrigin: env.origin, duration: 0.18, ease: "power2.out" }, 0)
        .to(react, { scaleY: 1, duration: 0.45, ease: "back.out(2)" }, 0.18)
        .fromTo(
          perk,
          { rotation: -8, transformOrigin: LEAF_ORIGIN },
          { rotation: 0, duration: 0.8, ease: "elastic.out(1, 0.4)", overwrite: "auto" },
          0.1,
        );
      break;

    case "startle": {
      const jump = env.kind === "face" ? -10 : -18;
      tl.fromTo(lids, { scaleY: 1 }, { scaleY: rest, duration: 0.12, ease: "power2.out", overwrite: "auto" }, 0)
        .to(react, { ...lift(env, jump, 1.14), duration: 0.14, ease: "power2.out" }, 0)
        .to(react, { ...settle(env), duration: 0.45, ease: "back.out(2.5)" }, 0.14)
        .to(react, { x: 3, duration: 0.05, repeat: 3, yoyo: true, ease: "none" }, 0.14)
        .fromTo(
          perk,
          { rotation: -14, transformOrigin: LEAF_ORIGIN },
          { rotation: 0, duration: 0.8, ease: "elastic.out(1, 0.35)", overwrite: "auto" },
          0.1,
        );
      break;
    }

    case "exhale":
      tl.to(react, { scaleY: 0.94, scaleX: 1.03, svgOrigin: env.origin, duration: 0.2, ease: "power1.out" }, 0)
        .to(react, { scaleY: 1, scaleX: 1, duration: 0.65, ease: "sine.inOut" }, 0.2)
        .to(
          perk,
          {
            rotation: 6,
            transformOrigin: LEAF_ORIGIN,
            duration: 0.14,
            repeat: 3,
            yoyo: true,
            ease: "sine.inOut",
            overwrite: "auto",
          },
          0,
        );
      break;

    case "doze":
      tl.fromTo(lids, { scaleY: prevRest }, { scaleY: rest, duration: 0.8, ease: "power1.inOut", overwrite: "auto" }, 0)
        .to(env.sleepyMouth, { scale: 1.8, transformOrigin: "50% 50%", duration: 0.35, ease: "power2.out" }, 0)
        .to(env.sleepyMouth, { scale: 1, duration: 0.4, ease: "power2.in" }, 0.4);
      break;

    case "hold":
      tl.to(react, { rotation: 4, svgOrigin: env.origin, duration: 0.2, ease: "power2.out" })
        .to(react, { rotation: 0, duration: 0.5, ease: "sine.inOut" });
      break;

    case "resume":
      tl.to(react, { ...lift(env, 5, 0.96), duration: 0.12, ease: "power2.out" })
        .to(react, { ...settle(env), duration: 0.3, ease: "back.out(2)" });
      break;

    case "celebrate":
      tl.to(react, { ...lift(env, -14, 1.1), duration: 0.22, ease: "power2.out" }, 0)
        .to(react, { ...settle(env), duration: 0.6, ease: "back.out(3)" }, 0.22)
        .fromTo(
          perk,
          { rotation: -9, transformOrigin: LEAF_ORIGIN },
          { rotation: 0, duration: 1, ease: "elastic.out(1, 0.25)", overwrite: "auto" },
          0,
        );
      break;
  }
  return tl;
}

/** Poke: squash plus a leaf impulse. Rapid pokes retarget from the current angle. */
export function buildPoke(env: TimelineEnv): gsap.core.Timeline {
  const { squash, perk } = env.parts;
  gsap.killTweensOf(squash);
  gsap.killTweensOf(perk);
  return gsap
    .timeline()
    .to(squash, { scaleY: 0.82, scaleX: 1.12, svgOrigin: env.origin, duration: 0.1, ease: "power2.out" }, 0)
    .to(squash, { scaleY: 1, scaleX: 1, duration: 0.9, ease: "elastic.out(1, 0.4)" }, 0.1)
    .to(perk, { rotation: "-=12", transformOrigin: LEAF_ORIGIN, duration: 0.1, ease: "power2.out" }, 0)
    .to(perk, { rotation: 0, duration: 1.1, ease: "elastic.out(1, 0.2)" }, 0.1);
}

/** Poke combo: full spin, swirly eyes for ~1.4 s, wobble recovery. */
export function buildDizzy(env: TimelineEnv): gsap.core.Timeline {
  const { react, pupils, spirals } = env.parts;
  const spinOrigin = env.kind === "full" ? "100 150" : env.origin;
  return gsap
    .timeline()
    .set(pupils, { opacity: 0 }, 0)
    .set(spirals, { opacity: 1 }, 0)
    .to(spirals, { rotation: 720, transformOrigin: "50% 50%", duration: 1.4, ease: "none" }, 0)
    .to(react, { rotation: 360, svgOrigin: spinOrigin, duration: 0.7, ease: "back.out(1.4)" }, 0)
    .set(react, { rotation: 0 }, 0.7)
    .to(react, { rotation: 6, svgOrigin: spinOrigin, duration: 0.12, ease: "sine.out" }, 0.7)
    .to(react, { rotation: -5, duration: 0.18, ease: "sine.inOut" }, 0.82)
    .to(react, { rotation: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" }, 1)
    .set(spirals, { opacity: 0, rotation: 0 }, 1.5)
    .set(pupils, { opacity: 1 }, 1.5);
}

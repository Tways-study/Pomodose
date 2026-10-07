// GSAP owns scroll-driven motion; framer-motion owns micro-interactions
// (press/hover/presence). Never animate the same element with both.
// Content must be visible by default: set initial hidden states only inside
// withMotion, so reduced-motion users and no-JS renders see everything.
// Import only from client components.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export { gsap, ScrollTrigger, useGSAP };

/** Wraps a function so tweens it creates later (events, delayed calls) join the matchMedia context. */
export type ContextSafe = <A extends unknown[], R>(fn: (...args: A) => R) => (...args: A) => R;

// Runs `setup` only when the user has no reduced-motion preference.
// Callers must revert the returned MatchMedia (e.g. in cleanup).
// `setup` receives a `safe` wrapper for callbacks that create tweens after setup returns.
export function withMotion(setup: (safe: ContextSafe) => void | (() => void)): gsap.MatchMedia {
  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", (_ctx, contextSafe) => {
    const safe: ContextSafe = (fn) =>
      contextSafe ? (contextSafe(fn) as typeof fn) : fn;
    return setup(safe);
  });
  return mm;
}

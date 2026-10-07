"use client";

import { useRef, type RefObject } from "react";
import { useGSAP, withMotion } from "@/lib/gsap";
import type { DoseyMood } from "@/lib/dosey-mood";
import { momentFor, type DoseyMoment } from "@/lib/dosey-motion";
import {
  buildDizzy,
  buildMoment,
  buildPoke,
  neutralize,
  type TimelineEnv,
} from "@/components/dosey/dosey-timelines";
import { LID_REST, type DoseyVariant } from "@/components/dosey/rig-config";
import { getRigParts, isOnScreen, mouthOf } from "@/components/dosey/rig-parts";

interface MomentParams {
  scope: RefObject<SVGSVGElement | null>;
  mood: DoseyMood;
  kind: DoseyVariant;
  origin: string;
  /** Eyelid scaleY at rest for the current mood. */
  lidRest: number;
  /** Set by the idle hook; read (and cleared) when the mood changes. */
  deepAsleepRef: RefObject<boolean>;
}

interface MomentApi {
  play: (moment: DoseyMoment, prevRest: number, rest: number) => void;
  poke: (dizzy: boolean) => void;
}

/**
 * One-shot reactions to mood changes, plus the poke squash and dizzy combo.
 * These live in their own gsap context (separate from the idle hook), so the
 * idle loops re-running never reverts a moment mid-flight. A new moment kills
 * the previous one first. Reduced motion: the api is never created.
 */
export function useDoseyMoments({
  scope,
  mood,
  kind,
  origin,
  lidRest,
  deepAsleepRef,
}: MomentParams): { poke: (dizzy: boolean) => void } {
  const apiRef = useRef<MomentApi | null>(null);
  const prevMood = useRef<DoseyMood | null>(null);

  // Builds the api. Declared before the mood effect so it exists on mount.
  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      const mm = withMotion((safe) => {
        const env: TimelineEnv = {
          parts: getRigParts(root),
          sleepyMouth: mouthOf(root, "sleepy"),
          kind,
          origin,
        };
        let current: gsap.core.Timeline | null = null;

        const start = (build: () => gsap.core.Timeline) => {
          current?.kill();
          neutralize(env);
          const tl = build();
          current = tl;
          tl.eventCallback("onComplete", () => {
            if (current === tl) current = null;
          });
        };

        apiRef.current = {
          play: safe((moment, prevRest, rest) =>
            start(() => buildMoment(moment, env, prevRest, rest)),
          ),
          poke: safe((dizzy) => {
            buildPoke(env);
            if (dizzy) start(() => buildDizzy(env));
          }),
        };

        return () => {
          apiRef.current = null;
          current?.kill();
        };
      });
      return () => mm.revert();
    },
    { scope, dependencies: [kind, origin], revertOnUpdate: true },
  );

  // Plays the moment for a mood change. Runs after the idle hook has reset the
  // lids to the new rest pose, so lid tweens can start from the old one.
  useGSAP(
    () => {
      const prev = prevMood.current;
      prevMood.current = mood;
      const wasDeepAsleep = deepAsleepRef.current;
      deepAsleepRef.current = false;
      const moment = momentFor(prev, mood, wasDeepAsleep);
      if (!moment || prev === null || !isOnScreen(scope.current)) return;
      apiRef.current?.play(moment, LID_REST[prev], lidRest);
    },
    { scope, dependencies: [mood] },
  );

  return { poke: (dizzy) => apiRef.current?.poke(dizzy) };
}

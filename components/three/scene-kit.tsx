"use client";

import { useEffect, useMemo } from "react";
import type { DataTexture } from "three";
import { makeToonGradient } from "@/lib/three/toon";

/** Shared Canvas settings: capped DPR, transparent, low-power GPU hint. */
export const CANVAS_DPR: [number, number] = [1, 1.5];
export const CANVAS_GL = { antialias: true, alpha: true, powerPreference: "low-power" } as const;

/** One 3-step toon ramp per scene, disposed on unmount. */
export function useToonGradient(): DataTexture {
  const gradient = useMemo(() => makeToonGradient(), []);
  useEffect(() => () => gradient.dispose(), [gradient]);
  return gradient;
}

/** Flat ambient fill plus a single directional light: no gloss, no specular. */
export function FlatLights() {
  return (
    <>
      <ambientLight intensity={1.15} />
      <directionalLight position={[3, 5, 6]} intensity={2.2} />
    </>
  );
}

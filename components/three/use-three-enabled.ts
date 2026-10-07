"use client";

import { useReducedMotion } from "framer-motion";
import { useSyncExternalStore } from "react";
import { hasWebGL2 } from "@/lib/three/webgl";

const subscribe = () => () => {};

/** True only on the client, with motion allowed and WebGL2 available. Never true during SSR. */
export function useThreeEnabled(): boolean {
  const reduceMotion = useReducedMotion();
  const webgl = useSyncExternalStore(subscribe, hasWebGL2, () => false);
  return webgl && reduceMotion === false;
}

"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";
import { isLowEndDevice, readDeviceHints } from "@/lib/three/capability";
import { hasWebGL2 } from "@/lib/three/webgl";

const subscribe = () => () => {};

/**
 * True only on the client, with motion allowed, WebGL2 available and a device that
 * is not asking to save data. Never true during SSR.
 */
export function useThreeEnabled(): boolean {
  const reduceMotion = useReducedMotion();
  const webgl = useSyncExternalStore(subscribe, hasWebGL2, () => false);
  const lowEnd = useSyncExternalStore(subscribe, () => isLowEndDevice(readDeviceHints()), () => true);
  return webgl && !lowEnd && reduceMotion === false;
}

function subscribePointer(onChange: () => void) {
  const query = window.matchMedia("(pointer: fine)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** True when the primary pointer is a mouse/trackpad (live; true during SSR). */
export function usePointerFine(): boolean {
  return useSyncExternalStore(subscribePointer, () => window.matchMedia("(pointer: fine)").matches, () => true);
}

/** Latches true the first time the element comes within `margin` of the viewport. */
export function useNearViewport(ref: RefObject<HTMLElement | null>, active: boolean, margin = "300px"): boolean {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!active || near || !el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setNear(true);
      },
      { rootMargin: margin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, active, near, margin]);
  return near;
}

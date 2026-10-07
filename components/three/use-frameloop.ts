"use client";

import { useEffect, useState, type RefObject } from "react";

/** "always" only while the element is on screen and the tab is visible; otherwise "never". */
export function useActiveFrameloop(ref: RefObject<HTMLElement | null>): "always" | "never" {
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      const last = entries[entries.length - 1];
      if (last) setInView(last.isIntersecting);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  useEffect(() => {
    const onChange = () => setTabVisible(!document.hidden);
    onChange();
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  return inView && tabVisible ? "always" : "never";
}

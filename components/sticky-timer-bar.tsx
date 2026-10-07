"use client";

import { useEffect, useState, type Dispatch, type RefObject } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import type { TimerState } from "@/types";
import type { TimerAction } from "@/lib/timer-machine";
import { PHASE_STICKER_CLASS } from "@/lib/phase-theme";
import { primaryAction } from "@/lib/primary-action";
import { PHASE_LABEL, formatTime } from "@/lib/timer-format";
import { stopCompletionAlert } from "@/lib/chime";
import { SPRING_BOUNCY, SPRING_UI } from "@/lib/motion";

interface Props {
  timer: TimerState;
  dispatch: Dispatch<TimerAction>;
  /** The Rx label wrapper; the bar shows only while it is out of view. */
  vialRef: RefObject<HTMLElement | null>;
}

// Strip pinned to the top once the Rx label scrolls away, so the countdown and
// start/pause control stay reachable. Hidden on desktop windows tall enough that
// the Rx card is sticky (page.tsx); shown on phones, tablets and short windows.
export function StickyTimerBar({ timer, dispatch, vialRef }: Props) {
  const reduceMotion = useReducedMotion();
  const [labelInView, setLabelInView] = useState(true);

  useEffect(() => {
    const el = vialRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      setLabelInView(entry.isIntersecting);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [vialRef]);

  const hidden = labelInView;
  const primary = primaryAction(timer);
  const Icon = primary.icon === "pause" ? Pause : Play;

  return (
    <motion.div
      aria-hidden={hidden}
      inert={hidden}
      initial={false}
      // Same animated keys on server and client (useReducedMotion differs between
      // them), so the SSR markup matches; reduced motion just drops the slide.
      animate={{ opacity: hidden ? 0 : 1, y: hidden ? "-100%" : 0 }}
      transition={reduceMotion ? { duration: 0.15, y: { duration: 0 } } : { ...SPRING_UI, opacity: { duration: 0.15 } }}
      className="fixed inset-x-0 top-0 z-sticky rounded-b-bubble bg-surface/95 pt-[env(safe-area-inset-top)] shadow-soft lg:[@media(min-height:900px)]:hidden"
    >
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-3 px-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`rounded-pill px-3 py-1 font-display text-sm font-medium shadow-gum ${PHASE_STICKER_CLASS[timer.phase]}`}>
            {PHASE_LABEL[timer.phase]}
          </span>
          <span className="digits text-2xl font-semibold text-ink">{formatTime(timer.remaining)}</span>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: reduceMotion ? 1 : 0.94 }}
          transition={SPRING_BOUNCY}
          onClick={() => {
            stopCompletionAlert();
            dispatch(primary.action);
          }}
          className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-pill bg-ink px-5 py-2 font-display text-base font-medium text-surface shadow-pop"
        >
          <Icon size={18} strokeWidth={2.25} aria-hidden />
          {primary.label}
        </motion.button>
      </div>
    </motion.div>
  );
}

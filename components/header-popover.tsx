"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { SPRING_BOUNCY, SPRING_SOFT } from "@/lib/motion";

interface Props {
  /** Accessible name of the panel (a non-modal dialog). */
  label: string;
  /** Accessible name of the trigger when its content is only an icon. */
  triggerLabel?: string;
  trigger: ReactNode;
  triggerClassName: string;
  panelClassName?: string;
  /** Classes for the wrapper that anchors the panel (e.g. to let the trigger grow). */
  rootClassName?: string;
  children: (api: { close: () => void }) => ReactNode;
}

/**
 * A button that opens a small non-modal panel beneath it (disclosure pattern):
 * Escape closes it and returns focus to the button, as does pressing an action
 * inside it that calls `close`; a pointer press or focus landing outside closes it
 * without stealing focus.
 */
export function HeaderPopover({
  label,
  triggerLabel,
  trigger,
  triggerClassName,
  panelClassName = "",
  rootClassName = "",
  children,
}: Props) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const triggerId = useId();

  // Found by id rather than a ref: `close` is handed to the render-prop children,
  // and reading a ref there would be a read during render.
  const close = useCallback(() => {
    setOpen(false);
    document.getElementById(triggerId)?.focus({ preventScroll: true });
  }, [triggerId]);

  // The panel hangs from the trigger's right edge, but on a phone the header wraps and
  // the trigger can sit anywhere in the row, so nudge the panel back inside the
  // viewport (16px margin). Uses the individual `translate` property so it composes
  // with the entrance transform instead of fighting it.
  useLayoutEffect(() => {
    const panel = panelRef.current;
    const root = rootRef.current;
    if (!open || !panel || !root) return;
    const margin = 16;
    const nudge = () => {
      const right = root.getBoundingClientRect().right;
      const left = right - panel.offsetWidth;
      let shift = 0;
      if (left < margin) shift = margin - left;
      else if (right > window.innerWidth - margin) shift = window.innerWidth - margin - right;
      panel.style.translate = shift ? `${shift}px 0` : "";
    };
    nudge();
    window.addEventListener("resize", nudge);
    return () => window.removeEventListener("resize", nudge);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const outside = (target: EventTarget | null) => !rootRef.current?.contains(target as Node);
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    function onPointerDown(e: PointerEvent) {
      if (outside(e.target)) setOpen(false);
    }
    function onFocusIn(e: FocusEvent) {
      if (outside(e.target)) setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [open, close]);

  return (
    <div ref={rootRef} className={`relative ${rootClassName}`}>
      <motion.button
        id={triggerId}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-haspopup="dialog"
        aria-label={triggerLabel}
        whileTap={{ scale: reduceMotion ? 1 : 0.94 }}
        transition={SPRING_BOUNCY}
        className={triggerClassName}
      >
        {trigger}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-label={label}
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.96, y: reduceMotion ? 0 : -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={reduceMotion ? { duration: 0.15 } : SPRING_SOFT}
            style={{ originX: 1, originY: 0 }}
            className={`absolute right-0 top-full z-overlay mt-2 w-[min(calc(100vw-2rem),22rem)] rounded-bubble border border-line-soft bg-surface p-4 text-ink shadow-soft ${panelClassName}`}
          >
            {children({ close })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

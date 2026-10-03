"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useActiveNotification } from "@/components/notification-provider";
import { isBurnoutEvent } from "@/lib/burnout";
import { EASE_OUT } from "@/lib/motion";
import type { NotificationEvent } from "@/types";

const NUDGE_EVENTS = new Set<NotificationEvent>(["break-unstarted", "paused-too-long"]);

function eyebrowFor(event: NotificationEvent): string {
  if (isBurnoutEvent(event)) return "Rx — Dosage Warning";
  if (NUDGE_EVENTS.has(event)) return "Rx — Take as Directed";
  return "Rx — Dispensed";
}

/**
 * The in-page notification surface: an auxiliary sticker strip on the ground,
 * not a corner toast. No progress bar, no badge — just the eyebrow + one
 * sentence. Color carries meaning: orange warns, yellow nudges, green dispensed.
 */
export function CounterNote() {
  const { note, dismiss } = useActiveNotification();
  const reduceMotion = useReducedMotion();

  // Directional blur-lift, mirroring quote-card.tsx — entrance/exit only,
  // opacity-only under reduced motion.
  const variants = reduceMotion
    ? { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        enter: { opacity: 0, y: -8, filter: "blur(4px)" },
        center: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, y: -8, filter: "blur(4px)" },
      };

  return (
    <AnimatePresence>
      {note && (
        <motion.div
          key={note.id}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: reduceMotion ? 0.2 : 0.45, ease: EASE_OUT }}
          role={isBurnoutEvent(note.event) ? "alert" : "status"}
          aria-live="polite"
          className={`mb-8 flex items-start justify-between gap-4 rounded-bubble px-5 py-3.5 shadow-gum ${
            isBurnoutEvent(note.event)
              ? "bg-gum-apricot text-ink"
              : NUDGE_EVENTS.has(note.event)
                ? "bg-gum-butter text-ink"
                : "bg-gum-mint text-ink"
          }`}
        >
          <div className="min-w-0">
            <span className="block font-display text-sm font-semibold mb-1">{eyebrowFor(note.event)}</span>
            <p className="font-body text-sm">{note.variant.note}</p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss notification"
            className="-my-2 -mr-3 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-pill hover:bg-ink/10 transition-colors duration-150"
          >
            <X size={20} strokeWidth={2.25} aria-hidden />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

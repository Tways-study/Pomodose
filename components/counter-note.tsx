"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
 * The in-page notification surface — deliberately a slim paper strip in the
 * page's own visual register, not a corner toast. DESIGN.md §6 bans
 * achievement toasts/gamified chrome, so this carries no icon, no progress
 * bar, no badge: just the eyebrow + one italic sentence, same typographic
 * move as the quote card's "Rx — Take as needed" tag.
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
          className={`mb-8 flex items-start justify-between gap-4 rounded-card px-5 py-3.5 ${
            isBurnoutEvent(note.event)
              ? "border border-clay-deep bg-clay/60"
              : "border border-line bg-paper-2"
          }`}
        >
          <div className="min-w-0">
            <span
              className={`block font-serif italic text-xs tracking-widest uppercase mb-1 ${
                isBurnoutEvent(note.event) ? "text-ink" : "text-lilac-deep"
              }`}
            >
              {eyebrowFor(note.event)}
            </span>
            <p className="font-serif italic text-sm text-ink">{note.variant.note}</p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss notification"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-ink-soft hover:text-ink transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-lilac-deep"
          >
            ×
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

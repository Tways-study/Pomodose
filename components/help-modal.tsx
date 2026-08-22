"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";

const TIPS = [
  {
    title: "The vial",
    body: "The glass vial tracks your current session. Press Start — the liquid drains as time passes. When the vial empties, your dose is complete.",
  },
  {
    title: "Focus cycles",
    body: "Each cycle is four 25-minute focus sessions. Complete all four and earn the antidote — a 15-minute long break.",
  },
  {
    title: "Today's regimen",
    body: "List your study goals in the Goals panel on the right. Check them off as you work; your progress bar updates in real time.",
  },
  {
    title: "Dosey, your companion",
    body: "Your AI pharmacist lives at the bottom of the page. Ask for study tips, motivation, or a focus nudge whenever you need one.",
  },
  {
    title: "The bell",
    body: "A pharmacy counter bell chimes when each session ends — and keeps ringing until you acknowledge it. Adjust the volume in the footer.",
  },
  {
    title: "The counter note",
    body: "A small note appears near the header when something's worth flagging — a dose dispensed, a refill waiting, or a gentle warning if you've skipped one too many breaks in a row.",
  },
  {
    title: "Desktop notifications",
    body: "Turn on \u201cNotify\u201d in the footer to get a desktop notification when a session ends while the tab is out of view.",
  },
];

interface Props {
  open: boolean;
  isFirstVisit: boolean;
  onClose: () => void;
}

export function HelpModal({ open, isFirstVisit, onClose }: Props) {
  // Keep a stable ref so the keydown effect doesn't need onClose as a dep.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    if (!open) return;
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current();
    }
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="help-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />

          {/* Card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            className="relative bg-paper border border-line rounded-card shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            initial={{ y: 20, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="mb-6">
                <p className="text-xs tracking-[.18em] uppercase text-ink-soft mb-1.5">
                  Dosing instructions
                </p>
                <h2
                  id="help-title"
                  className="font-serif font-semibold text-2xl tracking-tight leading-snug"
                >
                  {isFirstVisit ? "Your prescription is ready." : "How Pomodose works"}
                </h2>
                {isFirstVisit && (
                  <p className="text-sm text-ink-soft mt-2 leading-relaxed">
                    A few things to know before your first session.
                  </p>
                )}
              </div>

              {/* Tip list */}
              <ol className="flex flex-col gap-5">
                {TIPS.map((tip, i) => (
                  <li key={i} className="flex gap-4">
                    <span
                      aria-hidden
                      className="flex-none w-6 h-6 rounded-full bg-lilac flex items-center justify-center font-serif font-semibold text-xs text-ink shrink-0 mt-0.5"
                    >
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-serif font-semibold text-sm text-ink">{tip.title}</p>
                      <p className="text-sm text-ink-soft mt-0.5 leading-relaxed">{tip.body}</p>
                    </div>
                  </li>
                ))}
              </ol>

              {/* CTA */}
              <button
                onClick={onClose}
                className="mt-8 w-full rounded-xl bg-lilac hover:bg-lilac-deep hover:text-paper text-ink text-sm font-medium py-3 transition-colors duration-200"
              >
                {isFirstVisit ? "Begin my regimen" : "Close"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

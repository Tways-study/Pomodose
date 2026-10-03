"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bell, BellRing, FlaskConical, Keyboard, ListChecks, MessageCircle, Pill, Repeat, Sparkles, StickyNote, X, type LucideIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { DoseyRig } from "@/components/dosey/dosey-rig";
import { SPRING_BOUNCY, SPRING_SOFT } from "@/lib/motion";
import { SETTINGS } from "@/lib/settings";

const FOCUS_MIN = SETTINGS.FOCUS_DURATION / 60;
const SHORT_MIN = SETTINGS.SHORT_BREAK / 60;
const LONG_MIN = SETTINGS.LONG_BREAK / 60;

const BUBBLE_CLASS = {
  lilac: "bg-gum-lilac",
  sky: "bg-gum-sky",
  butter: "bg-gum-butter",
  mint: "bg-gum-mint",
  apricot: "bg-gum-apricot",
  rose: "bg-gum-rose",
} as const;

interface Tip {
  title: string;
  body: string;
  icon: LucideIcon;
  tone: keyof typeof BUBBLE_CLASS;
}

const TIPS: Tip[] = [
  {
    title: "How it works",
    icon: Sparkles,
    tone: "lilac",
    body: `Study in ${FOCUS_MIN}-minute focus sessions called doses, with a ${SHORT_MIN}-minute refill break after each. After ${SETTINGS.CYCLE_LENGTH} doses, take a ${LONG_MIN}-minute antidote break.`,
  },
  {
    title: "The vial",
    icon: FlaskConical,
    tone: "sky",
    body: "The glass vial tracks your current session. Press Start — the liquid drains as time passes. When the vial empties, your dose is complete.",
  },
  {
    title: "Space bar",
    icon: Keyboard,
    tone: "butter",
    body: "Press Space anywhere on the page to begin, pause or resume the current session. It stays out of the way while you're typing.",
  },
  {
    title: "Focus cycles",
    icon: Repeat,
    tone: "mint",
    body: `Each cycle is ${SETTINGS.CYCLE_LENGTH} ${FOCUS_MIN}-minute focus sessions. Complete them all and earn the antidote — a ${LONG_MIN}-minute long break.`,
  },
  {
    title: "Today's regimen",
    icon: ListChecks,
    tone: "apricot",
    body: "List your study goals in the Goals panel on the right. Check them off as you work; your progress bar updates in real time.",
  },
  {
    title: "Dosey, your study buddy",
    icon: MessageCircle,
    tone: "lilac",
    body: "Your study buddy lives at the bottom of the page. Ask for quizzes, explanations, study plans, or a focus nudge whenever you need one.",
  },
  {
    title: "The bell",
    icon: Bell,
    tone: "butter",
    body: "A pharmacy bell chimes when each session ends — and keeps ringing until you acknowledge it. Adjust the volume in the footer.",
  },
  {
    title: "The pharmacy note",
    icon: StickyNote,
    tone: "rose",
    body: "A small note appears near the header when something's worth flagging — a dose dispensed, a refill waiting, or a gentle warning if you've skipped one too many breaks in a row.",
  },
  {
    title: "Desktop notifications",
    icon: BellRing,
    tone: "sky",
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
  const reduceMotion = useReducedMotion();
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
          className="fixed inset-0 z-modal flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={onClose}
            aria-hidden
          />

          {/* Card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-bubble border border-line-soft bg-surface text-ink shadow-soft"
            initial={{ y: 16, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 8, scale: 0.98, opacity: 0, transition: { duration: 0.15 } }}
            transition={SPRING_SOFT}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line-soft py-2 pl-5 pr-2 sm:pl-6">
              <p className="font-display text-lg font-semibold">Dosing instructions</p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close help"
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-pill text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <X size={20} strokeWidth={2.25} aria-hidden />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              <div className="mb-6 flex items-center gap-4">
                <DoseyRig mood="relaxed" size={56} />
                <div className="min-w-0">
                  <h2 id="help-title" className="font-display text-2xl font-semibold leading-snug">
                    {isFirstVisit ? "Your prescription is ready." : "How Pomodose works"}
                  </h2>
                  {isFirstVisit && (
                    <p className="mt-2 font-body text-sm leading-relaxed text-ink-soft">
                      A few things to know before your first session.
                    </p>
                  )}
                </div>
              </div>

              {/* Tip list */}
              <ul className="flex flex-col gap-5">
                {TIPS.map((tip) => {
                  const Icon = tip.icon;
                  return (
                    <li key={tip.title} className="flex gap-4">
                      <span
                        aria-hidden
                        className={`grid h-10 w-10 flex-none place-items-center rounded-pill shadow-gum ${BUBBLE_CLASS[tip.tone]}`}
                      >
                        <Icon size={20} strokeWidth={2.25} className="text-ink" aria-hidden />
                      </span>
                      <div>
                        <p className="font-display text-base font-semibold text-ink">{tip.title}</p>
                        <p className="mt-0.5 font-body text-sm leading-relaxed text-ink-soft">{tip.body}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* CTA */}
              <motion.button
                onClick={onClose}
                whileTap={reduceMotion ? undefined : { scale: 0.94 }}
                transition={SPRING_BOUNCY}
                className="mt-8 flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-pill bg-ink px-6 py-3 font-display text-base font-medium text-surface shadow-pop"
              >
                <Pill size={18} strokeWidth={2.25} aria-hidden />
                {isFirstVisit ? "Begin my regimen" : "Close"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

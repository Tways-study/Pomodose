"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { todayKey } from "@/lib/date";
import { AnimatePresence, motion } from "framer-motion";
import { CircleHelp, Lightbulb, ListChecks, LogOut, Repeat, type LucideIcon } from "lucide-react";
import { PhaseTabs }        from "@/components/phase-tabs";
import { VialTimer }         from "@/components/vial-timer";
import { QuoteCard }         from "@/components/quote-card";
import { GoalList }          from "@/components/goal-list";
import { RegimenProgress }   from "@/components/regimen-progress";
import { DoseyChat }          from "@/components/dosey-chat";
import { ScrollReveals }       from "@/components/scroll-reveals";
import { useDoseyMood }        from "@/components/dosey/use-dosey-mood";
import type { DoseyStats, Phase, TimerStatus } from "@/types";
import { DoseyPeek } from "@/components/dosey/dosey-peek";
import { timerReducer, initialTimerState } from "@/lib/timer-machine";
import { stopCompletionAlert } from "@/lib/chime";
import { SETTINGS }           from "@/lib/settings";
import { useAddressTerm }      from "@/components/address-term-provider";
import { PHASE_STICKER_CLASS } from "@/lib/phase-theme";
import { SPRING_BOUNCY } from "@/lib/motion";
import { PHASE_LABEL } from "@/lib/timer-format";
import { StickyTimerBar } from "@/components/sticky-timer-bar";
import { ChimeVolume }         from "@/components/chime-volume";
import { HelpModal }           from "@/components/help-modal";
import { NotificationProvider } from "@/components/notification-provider";
import { CounterNote }         from "@/components/counter-note";
import { OsNotificationToggle } from "@/components/os-notification-toggle";

const MeetDosey = dynamic(
  () => import("@/components/dosey/meet-dosey").then((m) => m.MeetDosey),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[352px] rounded-bubble border border-line-soft bg-surface shadow-soft" />
    ),
  },
);

// Reads the mascot mood inside NotificationProvider (the hook needs its context).
function ConnectedDoseyChat({
  stats,
  open,
  onOpenChange,
}: {
  stats: DoseyStats;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mood = useDoseyMood(stats.phase, stats.status);
  return <DoseyChat stats={stats} open={open} onOpenChange={onOpenChange} mood={mood} />;
}

// Peeks over the top edge of the timer card; mood follows the session.
function ConnectedDoseyPeek({ phase, status }: { phase: Phase; status: TimerStatus }) {
  const mood = useDoseyMood(phase, status);
  return <DoseyPeek mood={mood} />;
}

function sigFor(phase: "focus" | "short" | "long"): string {
  if (phase === "focus") return `SIG: Study for ${SETTINGS.FOCUS_DURATION / 60} minutes, then take a ${SETTINGS.SHORT_BREAK / 60}-minute refill.`;
  if (phase === "short") return `SIG: Rest ${SETTINGS.SHORT_BREAK / 60} minutes, then back to the books.`;
  return `SIG: Rest ${SETTINGS.LONG_BREAK / 60} minutes — the antidote.`;
}

type CardTint = "mint" | "sky" | "butter" | "lilac";

// Full class strings so Tailwind sees them (never build these dynamically).
const CARD_TINT: Record<CardTint, { header: string; bubble: string }> = {
  mint: { header: "bg-gum-mint/25", bubble: "bg-gum-mint" },
  sky: { header: "bg-gum-sky/25", bubble: "bg-gum-sky" },
  butter: { header: "bg-gum-butter/25", bubble: "bg-gum-butter" },
  lilac: { header: "bg-gum-lilac/25", bubble: "bg-gum-lilac" },
};

// A soft card: tinted header row (icon bubble + title) and body.
function LabelCard({
  title,
  icon: Icon,
  tint,
  compact = false,
  children,
}: {
  title: string;
  icon: LucideIcon;
  tint: CardTint;
  compact?: boolean;
  children?: ReactNode;
}) {
  const t = CARD_TINT[tint];
  return (
    <div className="rounded-bubble border border-line-soft bg-surface text-ink shadow-soft">
      <div data-reveal-item className={`flex items-center gap-3 rounded-t-bubble px-5 py-3.5 sm:px-6 ${t.header}`}>
        <span className={`grid h-9 w-9 place-items-center rounded-pill shadow-gum ${t.bubble}`}>
          <Icon size={18} strokeWidth={2.25} className="text-ink" aria-hidden />
        </span>
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      </div>
      <div data-reveal-item className={compact ? "px-5 py-3 sm:px-6" : "p-5 sm:p-6"}>{children}</div>
    </div>
  );
}

export default function Home() {
  const { signOut } = useAuthActions();
  const router = useRouter();
  const [timer, dispatch] = useReducer(timerReducer, initialTimerState);
  const [goalsDone, setGoalsDone]   = useState(0);
  const [goalsTotal, setGoalsTotal] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const rightColRef = useRef<HTMLDivElement>(null);

  // --- Restore today's counters from persisted sessions -------------------
  // The timer reducer keeps dailyDoses/focusCycle in page state only, so a
  // reload used to reset them to zero mid-day. Seeded once, on the first
  // resolved query: after that the reducer owns the counters for this page
  // session, so an offline write can't clobber a count the user just earned.
  const { isAuthenticated } = useConvexAuth();
  const todaySessions = useQuery(
    api.sessions.listForDate,
    isAuthenticated ? { date: todayKey() } : "skip",
  );
  const hydratedRef = useRef(false);
  const rxLabelRef = useRef<HTMLDivElement>(null);

  // No entrance on the Rx label: it holds the primary Begin control, and hiding
  // it (even briefly) on every load would delay the app's most-used action.

  useEffect(() => {
    if (hydratedRef.current || todaySessions === undefined) return;
    hydratedRef.current = true;
    const focusCount = todaySessions.filter((s) => s.phase === "focus").length;
    if (focusCount === 0) return;
    dispatch({ type: "HYDRATE", dailyDoses: focusCount, focusCycle: focusCount });
  }, [todaySessions]);

  useEffect(() => {
    if (!localStorage.getItem("pomodose:onboarding-seen")) {
      // Intentional: post-mount localStorage check to avoid SSR mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsFirstVisit(true);
      setShowHelp(true);
    }
  }, []);

  function closeHelp() {
    setShowHelp(false);
    setIsFirstVisit(false);
    localStorage.setItem("pomodose:onboarding-seen", "1");
  }

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError(null);
    try {
      await signOut();
    } catch (err) {
      console.error("Sign out failed", err);
      setSignOutError("Couldn't sign out — try again.");
      setSigningOut(false);
      return;
    }
    router.push("/login");
    router.refresh();
  }

  const cyclePosition = timer.focusCycle % 4;
  const name = useAddressTerm();

  const isRunning = timer.status === "running";
  const isFocusRunning = isRunning && timer.phase === "focus";

  return (
    <NotificationProvider timer={timer} goalsDone={goalsDone} goalsTotal={goalsTotal}>
      <div className="relative z-content max-w-[1240px] mx-auto px-4 sm:px-8 pt-8 sm:pt-12 pb-32 sm:pb-28">

      {/* Header, on the ground */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10 lg:mb-0">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Pomodose</h1>
          <p className="mt-0.5 font-body text-base text-ink">Study companion</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3 rounded-pill bg-gum-butter px-5 py-1.5 text-ink shadow-gum">
            <span className="font-display text-sm font-medium">Doses today</span>
            <span className="font-display text-2xl font-semibold leading-none">{timer.dailyDoses}</span>
          </div>
          <motion.button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            whileTap={{ scale: 0.94 }}
            transition={SPRING_BOUNCY}
            className="flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-pill bg-surface-2 px-4 font-display text-sm font-medium text-ink shadow-gum transition-colors duration-150 hover:bg-gum-lilac/40 disabled:opacity-60"
          >
            <LogOut size={16} strokeWidth={2.25} aria-hidden />
            {signingOut ? "Signing out…" : "Sign out"}
          </motion.button>
          <AnimatePresence>
            {signOutError && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-control border-2 border-alert bg-surface px-3 py-2 text-xs text-alert"
                role="alert"
              >
                {signOutError}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </header>

      <CounterNote />

      {/* Main grid */}
      <main className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10 items-start">

        {/* Left: the Rx label. Sticky on desktop; no ancestor sets overflow. */}
        <div className="w-full lg:sticky lg:top-6">
          <div ref={rxLabelRef} className="relative pt-[90px]">
            {/* Dosey peeks over the card edge; the card (z-content) covers the head's lower part. */}
            <div data-peek-slot className="pointer-events-none absolute left-6 top-0 z-base h-[96px] w-[120px]">
              <ConnectedDoseyPeek phase={timer.phase} status={timer.status} />
            </div>
            {/* Decorative phase sticker on the label's corner */}
            <span
              aria-hidden
              className={`absolute right-3 top-[78px] z-sticky rotate-3 rounded-pill px-3 py-1 font-display text-sm font-medium shadow-gum transition-colors duration-200 ${PHASE_STICKER_CLASS[timer.phase]}`}
            >
              {PHASE_LABEL[timer.phase]} · {timer.total / 60} min
            </span>
            <div className="relative z-content rounded-bubble border border-line-soft bg-surface text-ink shadow-soft">
              <div className="flex flex-wrap items-center gap-2 px-5 pt-5 sm:px-6">
                <span className="rounded-pill bg-surface-2 px-3 py-1 font-display text-sm text-ink-soft">
                  Rx #{String(timer.dailyDoses + 1).padStart(4, "0")}
                </span>
                <span suppressHydrationWarning className="rounded-pill bg-surface-2 px-3 py-1 font-display text-sm text-ink-soft">
                  {todayKey()}
                </span>
              </div>
              <div className="px-5 pt-3 sm:px-6">
                <p className="font-display text-xl font-semibold">Pomodose Pharmacy</p>
                <p className="mt-1 font-body text-sm text-ink-soft">{sigFor(timer.phase)}</p>
              </div>
              <div className="px-5 pb-5 pt-4 sm:px-6">
                <PhaseTabs
                  active={timer.phase}
                  isRunning={isRunning}
                  onChange={phase => {
                    stopCompletionAlert();
                    dispatch({ type: "SET_PHASE", phase });
                  }}
                />
                <div className="mt-6">
                  <VialTimer state={timer} dispatch={dispatch} />
                </div>
              </div>
              <div className="px-5 pb-4 sm:px-6">
                <div aria-hidden className="dots-divider" />
                <p className="mt-3 font-body text-sm text-ink-soft">
                  Qty {SETTINGS.CYCLE_LENGTH} doses · refills {SETTINGS.CYCLE_LENGTH - cyclePosition}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: stacked label sections */}
        <div ref={rightColRef} className="w-full min-w-0 space-y-6 lg:pt-[90px]">
          <ScrollReveals scopeRef={rightColRef} refreshKey={goalsTotal} />
          <section data-reveal aria-label="Today's goals">
            <LabelCard title="Today's goals" icon={ListChecks} tint="mint">
              <GoalList
                onProgressChange={(done, total) => {
                  setGoalsDone(done);
                  setGoalsTotal(total);
                }}
              />
            </LabelCard>
          </section>

          <section data-reveal aria-label="Dose cycle">
            <LabelCard title="Dose cycle" icon={Repeat} tint="sky">
              <RegimenProgress
                cyclePosition={cyclePosition}
                dailyDoses={timer.dailyDoses}
                phase={timer.phase}
                isRunning={isRunning}
                isFocusRunning={isFocusRunning}
              />
            </LabelCard>
          </section>

          <section data-reveal id="meet-dosey" aria-label="Meet Dosey" className="min-h-[352px]">
            <MeetDosey phase={timer.phase} status={timer.status} onAskDosey={() => setChatOpen(true)} />
          </section>

          <section data-reveal aria-label="Study note">
            <LabelCard title="Study note" icon={Lightbulb} tint="butter" compact>
              <QuoteCard
                advanceSignal={timer.dailyDoses}
                paused={timer.status === "running"}
              />
            </LabelCard>
          </section>
        </div>
      </main>

      <footer className="mt-12 flex flex-col gap-4 border-t border-line-soft pt-5 font-body text-sm text-ink">
        <span>Each session is a measured dose — take care of yourself, {name}.</span>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <ChimeVolume />
            <OsNotificationToggle />
          </div>
          <span className="flex items-center gap-2">
            Pomodose · v1
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              aria-label="Help and tips"
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-pill bg-surface text-ink shadow-soft transition-colors duration-150 hover:bg-surface-2"
            >
              <CircleHelp size={20} strokeWidth={2.25} aria-hidden />
            </button>
          </span>
        </div>
      </footer>

      <StickyTimerBar timer={timer} dispatch={dispatch} vialRef={rxLabelRef} />

      <ConnectedDoseyChat
        open={chatOpen}
        onOpenChange={setChatOpen}
        stats={{
          dailyDoses: timer.dailyDoses,
          cyclePosition,
          cycleLength: SETTINGS.CYCLE_LENGTH,
          phase: timer.phase,
          status: timer.status,
        }}
      />
      </div>
      <HelpModal open={showHelp} isFirstVisit={isFirstVisit} onClose={closeHelp} />
    </NotificationProvider>
  );
}

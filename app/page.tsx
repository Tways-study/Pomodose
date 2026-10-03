"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useReducer, useRef, useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { todayKey } from "@/lib/date";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PhaseTabs }        from "@/components/phase-tabs";
import { VialTimer }         from "@/components/vial-timer";
import { VialMark }          from "@/components/vial-mark";
import { QuoteCard }         from "@/components/quote-card";
import { GoalList }          from "@/components/goal-list";
import { RegimenProgress }   from "@/components/regimen-progress";
import { DoseyChat }          from "@/components/dosey-chat";
import { timerReducer, initialTimerState } from "@/lib/timer-machine";
import { stopCompletionAlert } from "@/lib/chime";
import { SETTINGS }           from "@/lib/settings";
import { useAddressTerm }      from "@/components/address-term-provider";
import { PHASE_ACCENT, runningShadow } from "@/lib/phase-theme";
import { RxField }             from "@/components/rx-field";
import { ChimeVolume }         from "@/components/chime-volume";
import { HelpModal }           from "@/components/help-modal";
import { NotificationProvider } from "@/components/notification-provider";
import { CounterNote }         from "@/components/counter-note";
import { OsNotificationToggle } from "@/components/os-notification-toggle";
import { EASE_OUT, SPRING_UI } from "@/lib/motion";

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
      setSignOutError("Couldn't sign out, Doc — try again.");
      setSigningOut(false);
      return;
    }
    router.push("/login");
    router.refresh();
  }

  const cyclePosition = timer.focusCycle % 4;
  const name = useAddressTerm();

  // --- Phase-linked accent + running-state chrome, shared by the wash,
  // header sweep, and both dashboard cards ---------------------------------
  const reduceMotion = useReducedMotion();
  const isRunning = timer.status === "running";
  const isFocusRunning = isRunning && timer.phase === "focus";
  const phaseAccent = PHASE_ACCENT[timer.phase];

  // Staggered entrance for the four content blocks on mount — mirrors the
  // login page's blur-lift reveal. Runs once on mount; timer ticks and
  // running-state changes never replay it.
  const reveal = (delay: number) => ({
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, filter: "blur(5px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: reduceMotion ? 0.3 : 0.55, delay, ease: EASE_OUT },
  });

  // Two ambient washes, phase-colored via PHASE_ACCENT. They only breathe in
  // opacity (CSS keyframes in globals.css, compositor-friendly) at different
  // cadences so they never move in lockstep; the earlier x/y/scale drift ran on
  // the main thread for hours and is gone. Idle: faded out.

  // Header: the border itself recolors (not just a thin sweep underneath),
  // plus an under-glow — the header edge should read as unmistakably
  // different while running, not just faintly shimmering.
  const headerBorderColor = isRunning ? phaseAccent.base : undefined;
  const headerGlowOpacity = reduceMotion
    ? (isRunning ? 0.7 : 0)
    : (isRunning ? [0.45, 0.85, 0.45] : 0);
  const headerGlowTransition = !reduceMotion && isRunning
    ? { duration: 3.5, repeat: Infinity, ease: "easeInOut" as const }
    : { duration: 0.4, ease: "easeOut" as const };

  // Running-state dashboard-card treatment: accent hairline plus a wide soft
  // glow (runningShadow), binary on/off via CSS transition. Idle falls back to
  // the shadow-card class, so the inline style is only set while running.
  const cardShadowRunning = runningShadow(phaseAccent);

  return (
    <NotificationProvider timer={timer} goalsDone={goalsDone} goalsTotal={goalsTotal}>
      <div
        aria-hidden
        className={`ambient-wash ambient-a${isRunning ? " is-running" : ""}`}
        style={{ background: `radial-gradient(120% 90% at 10% 105%, ${phaseAccent.base} 0%, transparent 62%)` }}
      />
      <div
        aria-hidden
        className={`ambient-wash ambient-b${isRunning ? " is-running" : ""}`}
        style={{ background: `radial-gradient(100% 80% at 92% -6%, ${phaseAccent.deep} 0%, transparent 60%)` }}
      />
      <RxField accent={phaseAccent} active={isRunning} />
      <div className="relative z-10 max-w-[1180px] mx-auto px-4 sm:px-8 pt-8 sm:pt-12 pb-28">

      {/* Header */}
      <motion.header
        {...reveal(0)}
        className="relative flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5 mb-10 transition-[border-color] duration-500 ease-out"
        style={{ borderBottomColor: headerBorderColor }}
      >
        <div className="flex items-center gap-3.5">
          <VialMark />
          <div>
            <h1 className="font-serif font-medium text-2xl sm:text-3xl tracking-tight">Pomodose</h1>
            <p className="text-xs tracking-[.18em] uppercase text-ink-soft mt-0.5">Study Companion</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 w-full sm:w-auto">
          <p className="text-sm text-ink-soft">
            Daily Prescription &nbsp;
            <b className="font-serif text-lg text-ink font-semibold">{timer.dailyDoses}</b>
          </p>
          <motion.button
            onClick={handleSignOut}
            disabled={signingOut}
            whileTap={reduceMotion ? undefined : { scale: 0.96 }}
            transition={SPRING_UI}
            className="rounded-full px-3 py-1 text-xs text-ink-soft hover:text-ink hover:bg-paper-2 transition-colors disabled:opacity-60"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </motion.button>
          <AnimatePresence>
            {signOutError && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border border-clay-deep bg-clay/60 px-3 py-2 text-xs text-ink"
                role="alert"
              >
                {signOutError}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Running-state header glow: a soft, blurred bar sitting just below
            the (now recolored) border, breathing with the shared cadence. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -bottom-2 h-3 transition-[background] duration-500 ease-out"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${phaseAccent.base} 50%, transparent 100%)`,
            filter: "blur(6px)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: headerGlowOpacity }}
          transition={headerGlowTransition}
        />
      </motion.header>

      <CounterNote />

      {/* Main grid */}
      <main className="grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-8 lg:gap-14 max-w-xl mx-auto lg:max-w-none">

        {/* Left: timer + quote */}
        <motion.section {...reveal(0.08)} className="flex flex-col items-center text-center">
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

          <QuoteCard
            advanceSignal={timer.dailyDoses}
            paused={timer.status === "running"}
          />
        </motion.section>

        {/* Right: goals + progress */}
        <motion.aside {...reveal(0.14)} className="flex flex-col gap-5">
          <div
            className="bg-paper border border-line rounded-card shadow-card p-6 transition-[box-shadow] duration-700 ease-out"
            style={isRunning ? { boxShadow: cardShadowRunning } : undefined}
          >
            <GoalList
              onProgressChange={(done, total) => {
                setGoalsDone(done);
                setGoalsTotal(total);
              }}
            />
          </div>
          <RegimenProgress
            cyclePosition={cyclePosition}
            dailyDoses={timer.dailyDoses}
            goalsDone={goalsDone}
            goalsTotal={goalsTotal}
            phase={timer.phase}
            isRunning={isRunning}
            isFocusRunning={isFocusRunning}
          />
        </motion.aside>
      </main>

      <motion.footer {...reveal(0.2)} className="mt-12 pt-5 border-t border-line flex flex-col gap-4 text-xs text-ink-soft">
        <span className="font-serif italic">Each session is a measured dose — take care of yourself, {name}.</span>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <ChimeVolume />
            <OsNotificationToggle />
          </div>
          <span className="flex items-center gap-1">
            Pomodose · v1
            <button
              onClick={() => setShowHelp(true)}
              aria-label="Help and tips"
              className="flex h-10 w-10 items-center justify-center rounded-full text-xs hover:text-ink active:scale-95 transition-[color,transform] duration-150"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-current">?</span>
            </button>
          </span>
        </div>
      </motion.footer>

      <DoseyChat
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

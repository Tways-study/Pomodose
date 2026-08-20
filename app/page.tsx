"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useReducer, useState } from "react";
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

export default function Home() {
  const { signOut } = useAuthActions();
  const router = useRouter();
  const [timer, dispatch] = useReducer(timerReducer, initialTimerState);
  const [goalsDone, setGoalsDone]   = useState(0);
  const [goalsTotal, setGoalsTotal] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

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

  // --- Page-wide ambient wash: complements the vial's own running halo ---
  const reduceMotion = useReducedMotion();
  const isRunning = timer.status === "running";
  const ambientOpacity = reduceMotion
    ? (isRunning ? 0.14 : 0)
    : (isRunning ? [0.1, 0.22, 0.1] : 0);
  const ambientTransition = !reduceMotion && isRunning
    ? { duration: 3.5, repeat: Infinity, ease: "easeInOut" as const }
    : { duration: 0.4, ease: "easeOut" as const };

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "radial-gradient(65% 55% at 8% 108%, #C9B6E4 0%, transparent 72%)" }}
        initial={false}
        animate={{ opacity: ambientOpacity }}
        transition={ambientTransition}
      />
      <div className="relative z-10 max-w-[1180px] mx-auto px-4 sm:px-8 pt-8 sm:pt-12 pb-28">

      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5 mb-10">
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
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="text-xs text-ink-soft hover:text-ink transition-colors disabled:opacity-60"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
          <AnimatePresence>
            {signOutError && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl bg-clay/25 px-3 py-2 text-xs text-ink"
                role="alert"
              >
                {signOutError}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main grid */}
      <main className="grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-8 lg:gap-14 max-w-xl mx-auto lg:max-w-none">

        {/* Left: timer + quote */}
        <section className="flex flex-col items-center text-center">
          <PhaseTabs
            active={timer.phase}
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
        </section>

        {/* Right: goals + progress */}
        <aside className="flex flex-col gap-5">
          <div className="bg-paper border border-line rounded-card p-6 shadow-[0_1px_0_white_inset,0_8px_26px_-18px_rgba(46,36,51,.10)]">
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
          />
        </aside>
      </main>

      <footer className="mt-12 pt-5 border-t border-line flex flex-wrap justify-between gap-3 text-xs text-ink-soft">
        <span className="font-serif italic">Each session is a measured dose — take care of yourself, {name}.</span>
        <span>Pomodose · v1</span>
      </footer>

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
    </>
  );
}

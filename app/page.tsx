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
import { PHASE_ACCENT }        from "@/lib/phase-theme";
import { WispField }           from "@/components/wisp-field";

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

  // --- Phase-linked accent + running-state chrome, shared by the wash,
  // header sweep, and both dashboard cards ---------------------------------
  const reduceMotion = useReducedMotion();
  const isRunning = timer.status === "running";
  const isFocusRunning = isRunning && timer.phase === "focus";
  const phaseAccent = PHASE_ACCENT[timer.phase];

  // Made a full pass louder after a live feel-check: solid-color rings and
  // full-viewport coverage instead of faint low-alpha tints, because the
  // low-alpha version genuinely didn't register as "different" at a glance.
  const ambientOpacity = reduceMotion
    ? (isRunning ? 0.32 : 0)
    : (isRunning ? [0.2, 0.42, 0.2] : 0);
  const ambientOpacityTransition = !reduceMotion && isRunning
    ? { duration: 3.5, repeat: Infinity, ease: "easeInOut" as const }
    : { duration: 0.4, ease: "easeOut" as const };

  // Slow drift, deliberately much slower than the 3.5s breathe so the two
  // read as independent layers, not one mechanical loop.
  const ambientDrift = reduceMotion || !isRunning
    ? { x: 0, y: 0, scale: 1 }
    : { x: [0, 30, -14, 0], y: [0, -18, 10, 0], scale: [1, 1.08, 1.03, 1] };
  const ambientDriftTransition = !reduceMotion && isRunning
    ? { duration: 11, repeat: Infinity, ease: "easeInOut" as const }
    : { duration: 0.4, ease: "easeOut" as const };

  // Second ambient layer, top-right, deliberately off-cadence and phase-
  // inverted from the primary bottom-left wash (4.5s vs 3.5s breathe, 14s
  // vs 11s drift, opposite opacity phase) so the two never move in
  // lockstep — together they read as shifting light crossing the page
  // rather than one blob breathing in a corner. Uses the deeper accent
  // tone so it reads as a second, richer layer rather than a duplicate.
  const secondaryOpacity = reduceMotion
    ? (isRunning ? 0.24 : 0)
    : (isRunning ? [0.32, 0.14, 0.32] : 0);
  const secondaryOpacityTransition = !reduceMotion && isRunning
    ? { duration: 4.5, repeat: Infinity, ease: "easeInOut" as const }
    : { duration: 0.4, ease: "easeOut" as const };
  const secondaryDrift = reduceMotion || !isRunning
    ? { x: 0, y: 0, scale: 1 }
    : { x: [0, -26, 18, 0], y: [0, 22, -14, 0], scale: [1, 1.1, 1.04, 1] };
  const secondaryDriftTransition = !reduceMotion && isRunning
    ? { duration: 14, repeat: Infinity, ease: "easeInOut" as const }
    : { duration: 0.4, ease: "easeOut" as const };

  // Header: the border itself recolors (not just a thin sweep underneath),
  // plus an under-glow — the header edge should read as unmistakably
  // different while running, not just faintly shimmering.
  const headerBorderColor = isRunning ? phaseAccent.base : "#DED5C8";
  const headerGlowOpacity = reduceMotion
    ? (isRunning ? 0.7 : 0)
    : (isRunning ? [0.45, 0.85, 0.45] : 0);
  const headerGlowTransition = !reduceMotion && isRunning
    ? { duration: 3.5, repeat: Infinity, ease: "easeInOut" as const }
    : { duration: 0.4, ease: "easeOut" as const };

  // Running-state dashboard-card treatment: a solid-color 2px ring (not a
  // faint low-alpha tint) plus a real glow spill beneath — binary on/off
  // via CSS transition.
  const cardShadowIdle = "0 1px 0 white inset, 0 8px 26px -18px rgba(46,36,51,.10)";
  const cardShadowRunning = `0 1px 0 white inset, 0 0 0 2px ${phaseAccent.base}, 0 16px 40px -10px ${phaseAccent.deep}90`;

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 transition-[background] duration-700 ease-out"
        style={{ background: `radial-gradient(120% 90% at 10% 105%, ${phaseAccent.base} 0%, transparent 62%)` }}
        initial={false}
        animate={{ opacity: ambientOpacity, ...ambientDrift }}
        transition={{
          opacity: ambientOpacityTransition,
          x: ambientDriftTransition,
          y: ambientDriftTransition,
          scale: ambientDriftTransition,
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 transition-[background] duration-700 ease-out"
        style={{ background: `radial-gradient(100% 80% at 92% -6%, ${phaseAccent.deep} 0%, transparent 60%)` }}
        initial={false}
        animate={{ opacity: secondaryOpacity, ...secondaryDrift }}
        transition={{
          opacity: secondaryOpacityTransition,
          x: secondaryDriftTransition,
          y: secondaryDriftTransition,
          scale: secondaryDriftTransition,
        }}
      />
      <WispField accent={phaseAccent} active={isRunning} />
      <div className="relative z-10 max-w-[1180px] mx-auto px-4 sm:px-8 pt-8 sm:pt-12 pb-28">

      {/* Header */}
      <header
        className="relative flex flex-wrap items-end justify-between gap-4 border-b pb-5 mb-10 transition-[border-color] duration-500 ease-out"
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

        {/* Running-state header glow: a soft, blurred bar sitting just below
            the (now recolored) border, breathing with the shared cadence. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -bottom-2 h-3 transition-[background] duration-500 ease-out"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${phaseAccent.base} 50%, transparent 100%)`,
            filter: "blur(6px)",
          }}
          initial={false}
          animate={{ opacity: headerGlowOpacity }}
          transition={headerGlowTransition}
        />
      </header>

      {/* Main grid */}
      <main className="grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-8 lg:gap-14 max-w-xl mx-auto lg:max-w-none">

        {/* Left: timer + quote */}
        <section className="flex flex-col items-center text-center">
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
        </section>

        {/* Right: goals + progress */}
        <aside className="flex flex-col gap-5">
          <div
            className="bg-paper border border-line rounded-card p-6 transition-[box-shadow] duration-700 ease-out"
            style={{ boxShadow: isRunning ? cardShadowRunning : cardShadowIdle }}
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

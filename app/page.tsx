"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useReducer, useState } from "react";
import { PhaseTabs }        from "@/components/phase-tabs";
import { VialTimer }         from "@/components/vial-timer";
import { QuoteCard }         from "@/components/quote-card";
import { GoalList }          from "@/components/goal-list";
import { RegimenProgress }   from "@/components/regimen-progress";
import { DoseyChat }          from "@/components/dosey-chat";
import { timerReducer, initialTimerState } from "@/lib/timer-machine";
import { SETTINGS }           from "@/lib/settings";

export default function Home() {
  const { signOut } = useAuthActions();
  const router = useRouter();
  const [timer, dispatch] = useReducer(timerReducer, initialTimerState);
  const [goalsDone, setGoalsDone]   = useState(0);
  const [goalsTotal, setGoalsTotal] = useState(0);

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  const cyclePosition = timer.focusCycle % 4;

  return (
    <div className="max-w-[1180px] mx-auto px-4 sm:px-8 py-8 sm:py-12">

      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5 mb-10">
        <div className="flex items-center gap-3.5">
          {/* Pomodose vial mark */}
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden>
            <rect x="11" y="2" width="12" height="6" rx="2" fill="#C9B6E4" stroke="#2E2433" strokeWidth="2"/>
            <path d="M13 8v5l-5 14a4 4 0 0 0 3.7 5.5h10.6A4 4 0 0 0 26 27L21 13V8" stroke="#2E2433" strokeWidth="2" fill="rgba(201,182,228,.35)"/>
            <path d="M9.2 24h15.6" stroke="#9B7FC4" strokeWidth="2"/>
          </svg>
          <div>
            <h1 className="font-serif font-medium text-2xl sm:text-3xl tracking-tight">Pomodose</h1>
            <p className="text-xs tracking-[.18em] uppercase text-ink-soft mt-0.5">Study Companion</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <p className="text-sm text-ink-soft">
            Daily Prescription &nbsp;
            <b className="font-serif text-lg text-ink font-semibold">{timer.dailyDoses}</b>
          </p>
          <button
            onClick={handleSignOut}
            className="text-xs text-ink-soft hover:text-ink transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main grid */}
      <main className="grid grid-cols-1 lg:grid-cols-[1.15fr_.85fr] gap-8 lg:gap-14">

        {/* Left: timer + quote */}
        <section className="flex flex-col items-center text-center">
          <PhaseTabs active={timer.phase} onChange={phase => dispatch({ type: "SET_PHASE", phase })} />

          <div className="mt-8">
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
        <span className="font-serif italic">Each session is a measured dose — take care of yourself, Pill Whisperer.</span>
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
  );
}

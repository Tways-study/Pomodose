"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ADDRESS_TOKEN } from "@/lib/address-terms";
import { useAddressTerm } from "@/components/address-term-provider";
import { detectBurnout, isBurnoutEvent } from "@/lib/burnout";
import { NOTIFICATION_PRIORITY, nextVariant, type NotificationBag } from "@/lib/notification-copy";
import { flashCompletionTitle } from "@/lib/document-title";
import { isEnabled as osNotificationsEnabled, showNotification } from "@/lib/os-notification";
import { SETTINGS } from "@/lib/settings";
import type { BurnoutLevel, NotificationEvent, NotificationVariant, TimerState } from "@/types";

interface RenderedVariant {
  headline: string;
  note: string;
}

interface ActiveNote {
  id: number;
  event: NotificationEvent;
  variant: RenderedVariant;
}

interface NotificationContextValue {
  notify: (event: NotificationEvent) => void;
  activeNote: ActiveNote | null;
  dismissActiveNote: () => void;
  latest: ActiveNote | null;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

function render(variant: NotificationVariant, name: string): RenderedVariant {
  return {
    headline: variant.headline.replaceAll(ADDRESS_TOKEN, name),
    note: variant.note.replaceAll(ADDRESS_TOKEN, name),
  };
}

interface Props {
  timer: TimerState;
  goalsDone: number;
  goalsTotal: number;
  children: ReactNode;
}

/**
 * Owns the whole themed-notification pipeline: picking copy, arbitrating
 * priority, and fanning a single `notify(event)` call out to the four
 * surfaces (in-page counter note, tab title, OS notification, Dosey chat).
 * Also owns the detection effects (burnout heuristics, break/pause nudges,
 * milestones) that call notify() on the app's behalf — see CLAUDE.md's
 * dedupe rules, mirrored below per effect.
 */
export function NotificationProvider({ timer, goalsDone, goalsTotal, children }: Props) {
  const name = useAddressTerm();
  const [activeNote, setActiveNote] = useState<ActiveNote | null>(null);
  const [latest, setLatest] = useState<ActiveNote | null>(null);

  // Mirrors of the above two, read synchronously inside notify() so a burst
  // of notify() calls within one tick arbitrates correctly without waiting
  // on a render.
  const activeNoteRef = useRef<ActiveNote | null>(null);
  const bagRef = useRef<NotificationBag>({});
  const idRef = useRef(0);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDismissTimer = useCallback(() => {
    if (dismissTimerRef.current !== null) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  const dismissActiveNote = useCallback(() => {
    clearDismissTimer();
    activeNoteRef.current = null;
    setActiveNote(null);
  }, [clearDismissTimer]);

  const notify = useCallback(
    (event: NotificationEvent) => {
      const current = activeNoteRef.current;
      // Priority arbitration: a higher-priority note already on screen wins
      // and this call is dropped entirely (no title flash, no OS ping, no
      // chat line) rather than silently stomping what's currently shown.
      if (current && NOTIFICATION_PRIORITY[current.event] > NOTIFICATION_PRIORITY[event]) return;

      const { variant, bag } = nextVariant(event, bagRef.current);
      bagRef.current = bag;
      const rendered = render(variant, name);
      const id = ++idRef.current;
      const note: ActiveNote = { id, event, variant: rendered };

      activeNoteRef.current = note;
      setActiveNote(note);
      setLatest(note);

      clearDismissTimer();
      if (!isBurnoutEvent(event)) {
        dismissTimerRef.current = setTimeout(() => {
          if (activeNoteRef.current?.id === id) {
            activeNoteRef.current = null;
            setActiveNote(null);
          }
        }, SETTINGS.NOTE_DISMISS_MS);
      }

      flashCompletionTitle(rendered.headline);
      if (typeof document !== "undefined" && document.hidden && osNotificationsEnabled()) {
        showNotification(rendered.headline, rendered.note);
      }
    },
    [name, clearDismissTimer],
  );

  useEffect(() => clearDismissTimer, [clearDismissTimer]);

  // --- Burnout heuristics: checked immediately on every relevant state
  // change, then polled every 30s so long-stretch/late-hour (pure wall-clock
  // thresholds, not tied to a discrete action) still get caught.
  const seenBurnoutRef = useRef<Set<BurnoutLevel>>(new Set());

  // A break taken resets the grind-streak dedupe so no-antidote/overdose can
  // fire again on the next streak.
  useEffect(() => {
    if (timer.dosesSinceBreak === 0) {
      seenBurnoutRef.current.delete("no-antidote");
      seenBurnoutRef.current.delete("overdose");
    }
  }, [timer.dosesSinceBreak]);

  useEffect(() => {
    const check = () => {
      const level = detectBurnout(
        { dosesSinceBreak: timer.dosesSinceBreak, firstDoseAt: timer.firstDoseAt, status: timer.status },
        Date.now(),
      );
      if (level && !seenBurnoutRef.current.has(level)) {
        seenBurnoutRef.current.add(level);
        notify(level);
      }
    };
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, [timer.dosesSinceBreak, timer.firstDoseAt, timer.status, notify]);

  // --- Break/pause nudges: a single setTimeout per idle-in-break / paused
  // spell, cleared the moment the user takes any action that changes phase
  // or status (including resuming or completing the break).
  useEffect(() => {
    if (timer.status !== "idle" || timer.phase === "focus") return;
    const id = setTimeout(() => notify("break-unstarted"), SETTINGS.BREAK_NUDGE_MS);
    return () => clearTimeout(id);
  }, [timer.status, timer.phase, notify]);

  useEffect(() => {
    if (timer.status !== "paused") return;
    const id = setTimeout(() => notify("paused-too-long"), SETTINGS.PAUSE_NUDGE_MS);
    return () => clearTimeout(id);
  }, [timer.status, notify]);

  // --- Milestones ---

  // first-dose: fires once per page session, the moment dailyDoses goes 0 -> 1.
  const firstDoseFiredRef = useRef(false);
  useEffect(() => {
    if (timer.dailyDoses === 1 && !firstDoseFiredRef.current) {
      firstDoseFiredRef.current = true;
      notify("first-dose");
    }
  }, [timer.dailyDoses, notify]);

  // cycle-complete: fires once per completed cycle (every time focusCycle
  // crosses a multiple of CYCLE_LENGTH) — no dedupe set needed, each crossing
  // is a distinct, ever-increasing value.
  const lastCycleRef = useRef(timer.focusCycle);
  useEffect(() => {
    const prev = lastCycleRef.current;
    lastCycleRef.current = timer.focusCycle;
    if (timer.focusCycle > prev && timer.focusCycle % SETTINGS.CYCLE_LENGTH === 0) {
      notify("cycle-complete");
    }
  }, [timer.focusCycle, notify]);

  // goals-cleared: fires once per transition into the all-done state (can
  // fire again if goals are unchecked and re-completed later).
  const wasAllDoneRef = useRef(false);
  useEffect(() => {
    const allDone = goalsTotal > 0 && goalsDone === goalsTotal;
    if (allDone && !wasAllDoneRef.current) {
      notify("goals-cleared");
    }
    wasAllDoneRef.current = allDone;
  }, [goalsDone, goalsTotal, notify]);

  return (
    <NotificationContext.Provider value={{ notify, activeNote, dismissActiveNote, latest }}>
      {children}
    </NotificationContext.Provider>
  );
}

function useNotificationContext(hookName: string): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error(`${hookName} must be used within a NotificationProvider`);
  return ctx;
}

/** The single entry point for firing a themed notification. */
export function useNotify(): (event: NotificationEvent) => void {
  return useNotificationContext("useNotify").notify;
}

/** The note currently shown by <CounterNote />, plus a way to dismiss it early. */
export function useActiveNotification(): { note: ActiveNote | null; dismiss: () => void } {
  const ctx = useNotificationContext("useActiveNotification");
  return { note: ctx.activeNote, dismiss: ctx.dismissActiveNote };
}

/** The most recent notification fired, regardless of whether its counter
 * note has since auto-dismissed — for Dosey chat to append as a message. */
export function useLatestNotification(): ActiveNote | null {
  return useNotificationContext("useLatestNotification").latest;
}

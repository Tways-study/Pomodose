import { formatTime, PHASE_LABEL } from "@/lib/timer-format";
import type { Phase } from "@/types";

const DEFAULT_TITLE = "Pomodose — Study Companion"; // matches app/layout.tsx's metadata.title
const FLASH_TITLE = "⏰ Time's up! — Pomodose";
const FLASH_INTERVAL_MS = 1000;

let flashIntervalId: ReturnType<typeof setInterval> | null = null;

function handleVisibilityChange(): void {
  if (document.visibilityState === "visible") stopFlashing();
}

function stopFlashing(): void {
  if (flashIntervalId !== null) {
    clearInterval(flashIntervalId);
    flashIntervalId = null;
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  }
  document.title = DEFAULT_TITLE;
}

/** Call on every tick while a session is running. */
export function setRunningTitle(phase: Phase, remaining: number): void {
  if (typeof document === "undefined") return;
  stopFlashing();
  document.title = `${formatTime(remaining)} · ${PHASE_LABEL[phase]} — Pomodose`;
}

/** Call when the timer goes idle for any reason other than just completing (Reset, phase switch, unmount). */
export function resetTitle(): void {
  if (typeof document === "undefined") return;
  stopFlashing();
}

/** Call exactly once, at the moment a session completes. */
export function flashCompletionTitle(): void {
  if (typeof document === "undefined") return;
  stopFlashing();
  document.title = FLASH_TITLE;
  if (document.hidden) {
    let showingFlash = true;
    flashIntervalId = setInterval(() => {
      showingFlash = !showingFlash;
      document.title = showingFlash ? FLASH_TITLE : DEFAULT_TITLE;
    }, FLASH_INTERVAL_MS);
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }
}

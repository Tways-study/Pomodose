export type Phase = "focus" | "short" | "long";
export type TimerStatus = "idle" | "running" | "paused" | "complete";

export interface TimerState {
  phase: Phase;
  status: TimerStatus;
  remaining: number;   // seconds
  total: number;       // seconds (= duration for current phase)
  startedAt: number | null;  // Date.now() snapshot when last started
  focusCycle: number;  // how many focus sessions completed (mod 4 = position toward long break)
  dailyDoses: number;
  dosesSinceBreak: number;    // consecutive focus completions with no break taken between them
  firstDoseAt: number | null; // Date.now() snapshot of the first focus START this page session
}

export interface Goal {
  id: string; // Convex document id (convex/_generated/dataModel's Id<"goals">)
  text: string;
  done: boolean;
  createdAt: number;
}

// --- Dosey chat companion ---

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

// Compact, live snapshot of the user's session that Dosey reasons about.
export interface DoseyStats {
  dailyDoses: number;     // focus sessions completed today
  cyclePosition: number;  // focusCycle % cycleLength (position toward long break)
  cycleLength: number;    // focus sessions per cycle (SETTINGS.CYCLE_LENGTH)
  phase: Phase;
  status: TimerStatus;
}

// Client-persisted "Dosey is resting" state, and the shape of a 429 body
// from /api/chat. Both carry only resetAt — the UI derives "am I limited"
// and "when am I not" purely by comparing it to Date.now().
export interface DoseyRateLimitState {
  resetAt: string; // ISO instant when the daily quota refills
}

export interface ChatRateLimitError {
  error: string;
  resetAt: string;
}

// --- Themed notification micro-copy ---

export type NotificationEvent =
  | "focus-complete"
  | "short-complete"
  | "long-complete"
  | "break-unstarted"
  | "paused-too-long"
  | "no-antidote"
  | "overdose"
  | "long-stretch"
  | "late-hour"
  | "first-dose"
  | "cycle-complete"
  | "goals-cleared";

export interface NotificationVariant {
  headline: string; // <= 28 chars after %NAME% substitution -> tab title + OS notification title
  note: string;      // one short sentence -> in-page note, OS body, Dosey chat message
}

export type BurnoutLevel = "overdose" | "no-antidote" | "long-stretch" | "late-hour";

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

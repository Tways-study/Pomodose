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
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

export interface PersistedGoals {
  date: string;    // "YYYY-MM-DD"
  goals: Goal[];
}

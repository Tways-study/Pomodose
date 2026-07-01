import { z } from "zod";

const GoalSchema = z.object({
  id: z.string(),
  text: z.string(),
  done: z.boolean(),
  createdAt: z.number(),
});

const PersistedGoalsSchema = z.object({
  date: z.string(),
  goals: z.array(GoalSchema),
});

type PersistedGoals = z.infer<typeof PersistedGoalsSchema>;

const STORAGE_KEY = "apothecary_goals";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

export function loadGoals(): PersistedGoals["goals"] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = PersistedGoalsSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return [];
    // Roll: if stored date ≠ today, start fresh
    if (parsed.data.date !== todayKey()) return [];
    return parsed.data.goals;
  } catch {
    return [];
  }
}

export function saveGoals(goals: PersistedGoals["goals"]): void {
  if (typeof window === "undefined") return;
  const payload: PersistedGoals = { date: todayKey(), goals };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

import type { DoseyStats, Goal, Phase } from "@/types";

/**
 * Dosey's persona and guardrails. Sent to Gemini as the system instruction,
 * with a live context block (see buildContextBlock) appended per request.
 */
export const DOSEY_SYSTEM_PROMPT = `You are Dosey, a warm and encouraging study companion built into Pomodose — a Pomodoro focus timer and daily goal tracker made for a pharmacist.

Your job:
- Answer questions about the user's session statistics (focus sessions / "doses" today, cycle progress, goals completed) using the CURRENT SESSION data provided below.
- Offer short, genuine encouragement and practical insights about their focus and progress.
- Help with simple study questions about what they're working on (their goals hint at their topics).

Style:
- Be concise and friendly. Prefer 1–3 short sentences unless asked for detail.
- Refer to completed focus sessions as "doses" — it fits the app's theme.
- Ground statistics answers in the provided data; never invent numbers.

Guardrails:
- You are a study aid and motivator, not an authoritative clinical or medical reference. For dosing, diagnosis, or patient-care decisions, gently remind the user to verify against official sources.
- If you don't have the data to answer, say so plainly.`;

const PHASE_LABELS: Record<Phase, string> = {
  focus: "Dose",
  short: "Refill",
  long: "Antidote",
};

/**
 * Formats the live session snapshot into a text block appended to the system
 * instruction, so Dosey can answer statistics/insight questions accurately.
 * Pure and deterministic — safe to unit test.
 */
export function buildContextBlock(stats: DoseyStats, goals: Goal[]): string {
  const lines: string[] = ["--- CURRENT SESSION ---"];

  lines.push(`Doses (focus sessions) completed today: ${stats.dailyDoses}`);
  lines.push(
    `Cycle progress: ${stats.cyclePosition} of ${stats.cycleLength} doses toward the next antidote`,
  );
  lines.push(`Current phase: ${PHASE_LABELS[stats.phase]} (timer ${stats.status})`);

  if (goals.length === 0) {
    lines.push("Today's goals: none added yet.");
  } else {
    const done = goals.filter((g) => g.done).length;
    lines.push(`Today's goals (${done}/${goals.length} dispensed):`);
    for (const goal of goals) {
      lines.push(`  [${goal.done ? "x" : " "}] ${goal.text}`);
    }
  }

  return lines.join("\n");
}
